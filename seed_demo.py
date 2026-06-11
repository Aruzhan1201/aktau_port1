import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.ship import Ship, ShipStatus
from app.models.cargo import Cargo, CargoStatus
from app.models.berth import Berth, BerthStatus
from app.models.parking_zone import ParkingZone
from app.models.parking_spot import ParkingSpot, ParkingSpotStatus
from app.models.incident_report import IncidentReport, IncidentSeverity, IncidentStatus
from app.models.deal import Deal, DealType, DealStatus
from app.models.payment import Payment, PaymentType, PaymentStatus
from app.models.transit_route import TransitRoute
from app.models.weather_record import WeatherRecord
from app.models.port_config import PortConfig
from app.models.company import Company

now = datetime.now(timezone.utc)


async def seed():
    async with async_session_factory() as session:
        existing = await session.execute(select(User).where(User.email == "alice@demo.kz"))
        if existing.scalar_one_or_none():
            print("Demo data already exists, skipping.")
            return

        # === USERS ===
        users_data = [
            # (name, email, password, role, company_id)
            ("Alice Johnson", "alice@demo.kz", "demo123", UserRole.client, None),
            ("Bob Williams", "bob@demo.kz", "demo123", UserRole.client, None),
            ("Capt. Smith", "smith@demo.kz", "demo123", UserRole.captain, None),
            ("Capt. Jones", "jones@demo.kz", "demo123", UserRole.captain, None),
            ("Dave Driver", "dave@demo.kz", "demo123", UserRole.driver, None),
            ("Eve Driver", "eve@demo.kz", "demo123", UserRole.driver, None),
            ("Park Manager", "park@demo.kz", "demo123", UserRole.parking_manager, None),
            ("Port Manager", "port@demo.kz", "demo123", UserRole.port_manager, None),
            ("Gov Official", "gov@demo.kz", "demo123", UserRole.governance, None),
            ("Super Admin", "super@demo.kz", "demo123", UserRole.super_admin, None),
            ("Admin User", "admin@demo.kz", "demo123", UserRole.admin, None),
        ]
        users = {}
        for name, email, pw, role, cid in users_data:
            user = User(
                name=name, email=email,
                hashed_password=hash_password(pw),
                role=role, company_id=cid,
                phone=f"+7 700 000 00{len(users)+1:02d}",
                is_active=True,
            )
            session.add(user)
            await session.flush()
            users[email.split("@")[0]] = user

        alice = users["alice"]
        bob = users["bob"]
        smith = users["smith"]
        jones = users["jones"]
        dave = users["dave"]
        eve = users["eve"]
        park_mgr = users["park"]
        port_mgr = users["port"]
        gov = users["gov"]
        super_admin = users["super"]
        admin_user = users["admin"]

        # === COMPANIES ===
        companies = [
            ("Caspian Shipping LLC", "CS123456", "Aktau, Mangystau Region", "+7 7292 123456", "info@caspian-ship.kz"),
            ("Steppe Logistics Ltd", "SL789012", "Nur-Sultan, Kazakhstan", "+7 7172 789012", "contact@steppe-log.kz"),
            ("TransCaspian Freight", "TC345678", "Kuryk, Mangystau Region", "+7 7293 345678", "ops@transcaspian.kz"),
        ]
        comp_objs = []
        for name, tax, addr, phone, email in companies:
            c = Company(name=name, tax_id=tax, address=addr, phone=phone, email=email)
            session.add(c)
            await session.flush()
            comp_objs.append(c)

        # === SHIPS ===
        ships_data = [
            ("M/V Caspian Star", "1234567", smith.id, 25000.0, ShipStatus.available),
            ("M/T Karatau", "7654321", jones.id, 18000.0, ShipStatus.in_transit),
            ("M/V Akzhayik", "9988776", None, 30000.0, ShipStatus.available),
        ]
        ship_objs = []
        for name, imo, cap_id, capacity, status in ships_data:
            ship = Ship(name=name, imo_number=imo, captain_id=cap_id, capacity=capacity, status=status)
            session.add(ship)
            await session.flush()
            ship_objs.append(ship)

        # === BERTHS ===
        berths_data = [
            ("Berth A1", 5000.0, port_mgr.id, 43.65, 51.17, BerthStatus.free),
            ("Berth A2", 4000.0, port_mgr.id, 43.66, 51.18, BerthStatus.free),
            ("Berth B1", 6000.0, port_mgr.id, 43.64, 51.16, BerthStatus.reserved),
            ("Berth B2", 3500.0, port_mgr.id, 43.67, 51.19, BerthStatus.maintenance),
        ]
        berth_objs = []
        for name, cap, mgr, lat, lng, status in berths_data:
            b = Berth(name=name, capacity=cap, manager_id=mgr, location_coords={"lat": lat, "lng": lng}, status=status)
            session.add(b)
            await session.flush()
            berth_objs.append(b)

        # === CARGOES ===
        cargoes_data = [
            (alice, "Wheat Grain", 1500.0, "Aktau", "Baku", CargoStatus.in_transit, alice, dave,
             [{"lat": 43.65, "lng": 51.17}, {"lat": 43.30, "lng": 51.50},
              {"lat": 42.50, "lng": 51.00}, {"lat": 41.50, "lng": 50.30},
              {"lat": 40.37, "lng": 49.85}]),
            (alice, "Crude Oil", 5000.0, "Aktau", "Makhachkala", CargoStatus.created, None, None,
             [{"lat": 43.65, "lng": 51.17}, {"lat": 43.50, "lng": 50.50},
              {"lat": 43.20, "lng": 49.00}, {"lat": 42.98, "lng": 47.50}]),
            (bob, "Steel Pipes", 800.0, "Kuryk", "Turkmenbashi", CargoStatus.delivered, bob, eve,
             [{"lat": 43.22, "lng": 51.65}, {"lat": 42.50, "lng": 52.00},
              {"lat": 41.50, "lng": 52.30}, {"lat": 40.02, "lng": 52.98}]),
            (bob, "Container Goods", 2000.0, "Aktau", "Bandar Anzali", CargoStatus.assigned, bob, dave,
             [{"lat": 43.65, "lng": 51.17}, {"lat": 42.50, "lng": 51.00},
              {"lat": 41.00, "lng": 50.00}, {"lat": 39.50, "lng": 49.50},
              {"lat": 37.47, "lng": 49.47}]),
            (alice, "Machinery Parts", 300.0, "Kuryk", "Baku", CargoStatus.loading, alice, None,
             [{"lat": 43.22, "lng": 51.65}, {"lat": 42.50, "lng": 51.30},
              {"lat": 41.50, "lng": 50.50}, {"lat": 40.37, "lng": 49.85}]),
        ]
        cargo_objs = []
        for client, ctype, weight, origin, dest, status, sender, driver_id, waypoints in cargoes_data:
            c = Cargo(
                client_id=client.id,
                cargo_type=ctype,
                weight=weight,
                origin=origin,
                destination=dest,
                status=status,
                sender_id=sender.id if sender else None,
                driver_id=driver_id.id if driver_id else None,
                route_waypoints=waypoints,
                eta=(now + timedelta(days=3)),
                priority_score=5.0,
            )
            session.add(c)
            await session.flush()
            cargo_objs.append(c)

        # set ship for cargo 1 (in_transit) and cargo 4 (assigned)
        cargo_objs[0].ship_id = ship_objs[1].id  # Karatau
        cargo_objs[3].ship_id = ship_objs[0].id  # Caspian Star

        # === PARKING ZONES ===
        zones_data = [
            ("Zone A - North", "aktau", park_mgr.id, 20, 43.66, 51.18),
            ("Zone B - South", "aktau", park_mgr.id, 15, 43.63, 51.15),
            ("Zone C - Kuryk", "kuryk", park_mgr.id, 10, 43.23, 51.66),
        ]
        zone_objs = []
        for name, port, mgr, cap, lat, lng in zones_data:
            z = await _create_zone(session, name, port, mgr, cap, lat, lng)
            zone_objs.append(z)

        # occupy some spots
        spots_result = await session.execute(
            select(ParkingSpot).where(ParkingSpot.zone_id == zone_objs[0].id)
        )
        all_spots = list(spots_result.scalars().all())
        for i, spot in enumerate(all_spots[:3]):
            spot.status = ParkingSpotStatus.occupied
            spot.driver_id = dave.id if i % 2 == 0 else eve.id
            spot.time_in = now - timedelta(hours=i * 2)

        # === DEALS ===
        deals_data = [
            # completed deal: alice -> smith -> dave
            (DealType.cargo_transport, DealStatus.completed, alice.id, dave.id, smith.id, cargo_objs[0].id, 5000.0, True, True, True),
            # both_approved: bob -> jones -> dave (pending)
            (DealType.cargo_transport, DealStatus.both_approved, bob.id, dave.id, jones.id, cargo_objs[3].id, 3500.0, True, True, True),
            # pending: alice awaiting captain
            (DealType.cargo_transport, DealStatus.pending, alice.id, None, None, cargo_objs[1].id, 8000.0, False, False, False),
            # parking rental completed
            (DealType.parking_rental, DealStatus.completed, dave.id, dave.id, None, None, 200.0, True, True, False),
            # parking rental pending
            (DealType.parking_rental, DealStatus.pending, eve.id, eve.id, None, None, 150.0, False, False, False),
        ]
        for dtype, status, cid, did, capid, cargo_id, price, ca, da, cpa in deals_data:
            deal = Deal(
                type=dtype, status=status,
                client_id=cid, driver_id=did, captain_id=capid,
                cargo_id=cargo_id, proposed_price=price, currency="USD",
                client_approved=ca, driver_approved=da, captain_approved=cpa,
                client_status="approved" if ca else "pending",
                driver_status="approved" if da else "pending",
                captain_status="approved" if cpa else "pending",
                notes=f"Demo deal - {dtype.value}",
            )
            if status == DealStatus.both_approved:
                deal.phone_revealed_at = now - timedelta(hours=6)
            session.add(deal)

        # === INCIDENTS ===
        incidents_data = [
            ("aktau", "Berth congestion", IncidentSeverity.medium, "Berth A2 experiencing delays due to high traffic volume in the port area.", IncidentStatus.open),
            ("kuryk", "Storm warning", IncidentSeverity.high, "Severe weather conditions approaching Kuryk port. Wind speeds exceeding 20 m/s.", IncidentStatus.investigating),
            ("aktau", "Equipment malfunction", IncidentSeverity.low, "Crane #3 at Berth B1 requires maintenance after reported mechanical issue.", IncidentStatus.resolved),
            ("aktau", "Traffic jam at port entrance", IncidentSeverity.medium, "15 trucks waiting at the main gate due to document processing delays.", IncidentStatus.open),
        ]
        for port, itype, severity, desc, status in incidents_data:
            inc = IncidentReport(
                port=port, incident_type=itype, severity=severity,
                description=desc, reported_by=gov.id, status=status,
            )
            session.add(inc)

        # === PAYMENTS ===
        payments_data = [
            (PaymentType.cargo_fee, 5000.0, "USD", cargo_objs[0].id, None, alice.id, PaymentStatus.paid,
             "Halyk Bank", "KZ1234567890", "bank_transfer", "INV-2024-001"),
            (PaymentType.cargo_fee, 3500.0, "USD", cargo_objs[3].id, None, bob.id, PaymentStatus.pending,
             "Kaspi Bank", "KZ0987654321", "bank_transfer", "INV-2024-002"),
            (PaymentType.berth_fee, 200.0, "USD", None, None, smith.id, PaymentStatus.paid,
             "Halyk Bank", "KZ1122334455", "card", "BERTH-2024-001"),
            (PaymentType.penalty, 150.0, "USD", cargo_objs[2].id, None, bob.id, PaymentStatus.paid,
             "Kaspi Bank", "KZ5566778899", "bank_transfer", "PEN-2024-001"),
        ]
        for ptype, amt, cur, cid, rid, paid_by, pstatus, bank, acct, method, ref in payments_data:
            pmt = Payment(
                type=ptype, amount=amt, currency=cur,
                cargo_id=cid, reservation_id=rid,
                paid_by=paid_by, status=pstatus,
                paid_at=now - timedelta(days=1) if pstatus == PaymentStatus.paid else None,
                bank_name=bank, bank_account=acct, payment_method=method, reference_number=ref,
            )
            session.add(pmt)

        # === TRANSIT ROUTES (for traffic map) ===
        routes_data = [
            ("TITR Aktau→Baku", "aktau",
             [{"lat": 43.65, "lng": 51.17}, {"lat": 43.50, "lng": 51.50},
              {"lat": 43.30, "lng": 51.80}, {"lat": 42.50, "lng": 51.00},
              {"lat": 41.80, "lng": 50.00}, {"lat": 40.37, "lng": 49.85}],
             "#10b981", "Trans-Caspian International Transport Route - Aktau to Baku"),
            ("Caspian North-South", "aktau",
             [{"lat": 43.65, "lng": 51.17}, {"lat": 43.20, "lng": 51.00},
              {"lat": 42.50, "lng": 50.50}, {"lat": 41.80, "lng": 50.00},
              {"lat": 40.50, "lng": 49.50}],
             "#3b82f6", "North-South Caspian transit route"),
            ("Kuryk→Turkmenbashi", "kuryk",
             [{"lat": 43.22, "lng": 51.65}, {"lat": 43.10, "lng": 51.90},
              {"lat": 42.90, "lng": 52.20}, {"lat": 42.50, "lng": 52.50},
              {"lat": 40.00, "lng": 52.00}],
             "#f59e0b", "Kuryk to Turkmenbashi ferry route"),
            ("Kuryk→Baku", "kuryk",
             [{"lat": 43.22, "lng": 51.65}, {"lat": 42.80, "lng": 51.30},
              {"lat": 42.30, "lng": 50.80}, {"lat": 41.80, "lng": 50.00},
              {"lat": 40.37, "lng": 49.85}],
             "#8b5cf6", "Kuryk to Baku direct route"),
        ]
        for name, port, waypoints, color, desc in routes_data:
            route = TransitRoute(name=name, port=port, waypoints=waypoints, color_hex=color, description=desc)
            session.add(route)

        # === WEATHER (for map weather overlays) ===
        weather_data = [
            ("aktau", 8.5, "NW", 1.2, 8000.0, 12.0, False),
            ("kuryk", 12.0, "SE", 1.8, 6000.0, 14.0, True),
        ]
        for port, wind_spd, wind_dir, wave_h, vis, water_temp, storm in weather_data:
            w = WeatherRecord(
                port=port, wind_speed=wind_spd, wind_direction=wind_dir,
                wave_height=wave_h, visibility=vis, water_temperature=water_temp,
                storm_alert=storm, storm_alert_message="Storm warning" if storm else None,
                fetched_at=now,
            )
            session.add(w)

        # === PORT CONFIGS ===
        for port_name, display_name, lat, lng in [
            ("aktau", "Aktau Port", 43.65, 51.17),
            ("kuryk", "Kuryk Port", 43.22, 51.65),
        ]:
            pc = PortConfig(
                port_name=port_name, display_name=display_name,
                center_lat=lat, center_lng=lng, zoom_level=14,
                operations_status="active",
            )
            session.add(pc)

        await session.commit()

        print("=" * 60)
        print("  SEED DATA CREATED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("  Users:")
        for name, email, pw, role, _ in users_data:
            print(f"    {role.value:20s}  {email:25s}  {pw}")
        print()
        print(f"  Ships:      {len(ship_objs)}")
        print(f"  Cargoes:    {len(cargo_objs)}")
        print(f"  Berths:     {len(berths_data)}")
        print(f"  Zones:      {len(zones_data)}")
        print(f"  Deals:      {len(deals_data)}")
        print(f"  Incidents:  {len(incidents_data)}")
        print(f"  Payments:   {len(payments_data)}")
        print(f"  Routes:     {len(routes_data)}")
        print(f"  Weather:    {len(weather_data)}")


async def _create_zone(session, name, port, manager_id, capacity, lat, lng):
    zone = ParkingZone(name=name, port=port, manager_id=manager_id, capacity=capacity,
                       location_coords={"lat": lat, "lng": lng})
    session.add(zone)
    await session.flush()
    for i in range(1, capacity + 1):
        spot = ParkingSpot(
            zone_id=zone.id,
            spot_number=f"{name.split('-')[0].strip()}-{i:03d}",
            status=ParkingSpotStatus.free,
            tariff_per_hour=5.0,
        )
        session.add(spot)
    await session.flush()
    return zone


if __name__ == "__main__":
    asyncio.run(seed())
