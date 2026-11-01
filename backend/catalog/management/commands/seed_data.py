"""
Management command to seed comprehensive sample data for ShopNest.
Creates:
- 4 diverse verified seller stores (Tech, Fashion, Home Living, Athletics)
- Hierarchical product categories
- 20 realistic products with high-resolution preview images
- Multi-vendor historical customer orders with split SellerOrders
- Verified customer reviews & ratings
- Active shopping cart for testcustomer

Usage:
    python manage.py seed_data
"""

import os
from decimal import Decimal
from PIL import Image, ImageDraw, ImageFont

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone

from sellers.models import SellerProfile, Store
from catalog.models import Category, Product, ProductImage, Review
from orders.models import Cart, CartItem, Order, SellerOrder, OrderItem

User = get_user_model()


def generate_product_image(slug, title, store_name, bg_color, accent_color):
    """Generates an aesthetic 600x600 product showcase image."""
    media_dir = os.path.join(settings.MEDIA_ROOT, "products")
    os.makedirs(media_dir, exist_ok=True)
    filename = f"{slug}.png"
    filepath = os.path.join(media_dir, filename)

    img = Image.new("RGB", (600, 600), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Outer decorative frame
    draw.rectangle([(24, 24), (576, 576)], outline=accent_color, width=3)
    draw.rectangle([(32, 32), (568, 568)], outline=(255, 255, 255, 40), width=1)

    # Accent top badge
    badge_bg = accent_color
    draw.rounded_rectangle([(48, 48), (280, 86)], radius=8, fill=badge_bg)
    draw.text((164, 67), store_name.upper(), fill=(255, 255, 255), anchor="mm")

    # Center circle illustration placeholder
    center_x, center_y = 300, 270
    draw.ellipse(
        [(center_x - 110, center_y - 110), (center_x + 110, center_y + 110)],
        fill=(255, 255, 255, 25),
        outline=accent_color,
        width=2,
    )
    draw.text((center_x, center_y), "SHOPNEST", fill=(255, 255, 255), anchor="mm")

    # Product Title banner
    draw.rounded_rectangle([(48, 430), (552, 530)], radius=12, fill=(15, 23, 42, 220))
    # Truncate title for display if too long
    display_title = title if len(title) <= 32 else title[:29] + "..."
    draw.text((300, 465), display_title, fill=(255, 255, 255), anchor="mm")
    draw.text((300, 500), "VERIFIED VENDOR GUARANTEE", fill=accent_color, anchor="mm")

    img.save(filepath, format="PNG")
    return f"products/{filename}"


class Command(BaseCommand):
    help = "Seeds comprehensive marketplace data with multiple stores, products, reviews, and orders."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding comprehensive ShopNest marketplace data..."))

        # -------------------------------------------------------------------
        # 1. Platform Admin Superuser
        # -------------------------------------------------------------------
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@shopnest.local",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Platform",
                "last_name": "Admin",
            },
        )
        admin_user.set_password("admin123456")
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        # -------------------------------------------------------------------
        # 2. Customers
        # -------------------------------------------------------------------
        customer1, _ = User.objects.get_or_create(
            username="testcustomer",
            defaults={
                "email": "customer@example.com",
                "role": User.Role.CUSTOMER,
                "first_name": "Jordan",
                "last_name": "Lee",
                "phone_number": "+1-555-0144",
                "address": "742 Evergreen Terrace, Springfield, OR",
            },
        )
        customer1.set_password("TestPass123!")
        customer1.save()

        customer2, _ = User.objects.get_or_create(
            username="sarah_shopper",
            defaults={
                "email": "sarah@example.com",
                "role": User.Role.CUSTOMER,
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "phone_number": "+1-555-0177",
                "address": "1200 Market Street, San Francisco, CA",
            },
        )
        customer2.set_password("CustomerPass123!")
        customer2.save()

        # -------------------------------------------------------------------
        # 3. Sellers & Stores (4 Diverse Vendors)
        # -------------------------------------------------------------------
        stores_data = [
            {
                "username": "techseller",
                "email": "techseller@example.com",
                "first_name": "Alex",
                "last_name": "Vance",
                "business_name": "TechZone Direct",
                "business_description": "Authorized dealer for high-grade consumer electronics, audio, and gadgets.",
                "business_email": "support@techzonedirect.com",
                "business_phone": "+1-555-0199",
                "business_address": "840 Tech Boulevard, Austin, TX",
                "store_name": "TechZone Direct",
                "store_desc": "Your reliable source for premium tech, flagship devices, and audiophile gear.",
                "bg_color": (15, 23, 42),      # Dark Slate
                "accent_color": (99, 102, 241),  # Indigo
            },
            {
                "username": "fashionseller",
                "email": "fashion@example.com",
                "first_name": "Elena",
                "last_name": "Rostova",
                "business_name": "UrbanWear Studio",
                "business_description": "Sustainable everyday modern apparel and minimalist streetwear.",
                "business_email": "hello@urbanwear.com",
                "business_phone": "+1-555-0288",
                "business_address": "42 SoHo Street, New York, NY",
                "store_name": "UrbanWear Studio",
                "store_desc": "Comfortable, modern clothing crafted from eco-friendly cotton and durable canvas.",
                "bg_color": (28, 25, 23),      # Warm Charcoal
                "accent_color": (245, 158, 11), # Amber
            },
            {
                "username": "homeseller",
                "email": "home@example.com",
                "first_name": "Lukas",
                "last_name": "Lindqvist",
                "business_name": "NordicCraft Home",
                "business_description": "Handcrafted Scandinavian interior decor, workspace accessories, and ceramics.",
                "business_email": "contact@nordiccraft.com",
                "business_phone": "+1-555-0311",
                "business_address": "104 Pine Valley Way, Seattle, WA",
                "store_name": "NordicCraft Home",
                "store_desc": "Elevate your living and work space with minimalist Scandinavian functional design.",
                "bg_color": (19, 78, 74),      # Deep Teal
                "accent_color": (16, 185, 129), # Emerald
            },
            {
                "username": "sportseller",
                "email": "athletics@example.com",
                "first_name": "Marcus",
                "last_name": "Sterling",
                "business_name": "PeakPulse Athletics",
                "business_description": "Pro-grade fitness equipment, running gear, and functional workout accessories.",
                "business_email": "team@peakpulse.com",
                "business_phone": "+1-555-0455",
                "business_address": "520 Olympic Way, Denver, CO",
                "store_name": "PeakPulse Athletics",
                "store_desc": "Engineered for endurance. Premium training equipment and outdoor performance essentials.",
                "bg_color": (30, 27, 75),      # Navy Indigo
                "accent_color": (14, 165, 233), # Sky Blue
            },
        ]

        stores = {}
        for s in stores_data:
            seller_user, _ = User.objects.get_or_create(
                username=s["username"],
                defaults={
                    "email": s["email"],
                    "role": User.Role.SELLER,
                    "first_name": s["first_name"],
                    "last_name": s["last_name"],
                },
            )
            seller_user.set_password("SellerPass123!")
            seller_user.save()

            profile, _ = SellerProfile.objects.get_or_create(
                user=seller_user,
                defaults={
                    "business_name": s["business_name"],
                    "business_description": s["business_description"],
                    "business_email": s["business_email"],
                    "business_phone": s["business_phone"],
                    "business_address": s["business_address"],
                    "approval_status": SellerProfile.ApprovalStatus.APPROVED,
                },
            )
            store, _ = Store.objects.get_or_create(
                seller_profile=profile,
                defaults={
                    "name": s["store_name"],
                    "description": s["store_desc"],
                    "is_active": True,
                },
            )
            stores[s["username"]] = (store, s["bg_color"], s["accent_color"])

        # -------------------------------------------------------------------
        # 4. Categories (Hierarchical Trees)
        # -------------------------------------------------------------------
        # Root Categories
        cat_electronics, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={"name": "Electronics", "description": "Cutting-edge gadgets, audio, and mobile devices"},
        )
        cat_fashion, _ = Category.objects.get_or_create(
            slug="fashion",
            defaults={"name": "Fashion & Apparel", "description": "Curated modern streetwear, shoes, and bags"},
        )
        cat_home, _ = Category.objects.get_or_create(
            slug="home-living",
            defaults={"name": "Home & Living", "description": "Workspace setups, ambient lighting, and ceramics"},
        )
        cat_sports, _ = Category.objects.get_or_create(
            slug="sports-outdoors",
            defaults={"name": "Sports & Fitness", "description": "Performance fitness gear and active accessories"},
        )

        # Subcategories
        sub_phones, _ = Category.objects.get_or_create(
            slug="smartphones",
            defaults={"name": "Smartphones & Tablets", "parent": cat_electronics},
        )
        sub_audio, _ = Category.objects.get_or_create(
            slug="audio-headphones",
            defaults={"name": "Audio & Headphones", "parent": cat_electronics},
        )
        sub_wearables, _ = Category.objects.get_or_create(
            slug="smart-wearables",
            defaults={"name": "Smart Home & Wearables", "parent": cat_electronics},
        )
        sub_streetwear, _ = Category.objects.get_or_create(
            slug="streetwear",
            defaults={"name": "Hoodies & Jackets", "parent": cat_fashion},
        )
        sub_bags, _ = Category.objects.get_or_create(
            slug="bags-backpacks",
            defaults={"name": "Bags & Backpacks", "parent": cat_fashion},
        )
        sub_footwear, _ = Category.objects.get_or_create(
            slug="footwear",
            defaults={"name": "Casual Footwear", "parent": cat_fashion},
        )
        sub_workspace, _ = Category.objects.get_or_create(
            slug="workspace",
            defaults={"name": "Desk & Workspace", "parent": cat_home},
        )
        sub_dining, _ = Category.objects.get_or_create(
            slug="kitchen-dining",
            defaults={"name": "Kitchen & Ceramics", "parent": cat_home},
        )
        sub_fitness, _ = Category.objects.get_or_create(
            slug="gym-fitness",
            defaults={"name": "Training & Yoga", "parent": cat_sports},
        )
        sub_outdoors, _ = Category.objects.get_or_create(
            slug="outdoor-travel",
            defaults={"name": "Hydration & Travel Gear", "parent": cat_sports},
        )

        # -------------------------------------------------------------------
        # 5. Products (20 Distinct Catalog Items)
        # -------------------------------------------------------------------
        products_catalog = [
            # TechZone Direct (Electronics)
            {
                "seller_key": "techseller",
                "category": sub_phones,
                "name": "AeroPhone Ultra 5G (256GB)",
                "description": "Flagship 6.7-inch dynamic AMOLED display with 120Hz refresh rate, 50MP triple camera system, and all-day 5000mAh battery life.",
                "price": Decimal("899.99"),
                "compare_at_price": Decimal("999.99"),
                "stock": 45,
                "sku": "TECH-AP5G-256",
                "is_featured": True,
                "attributes": {"color": "Midnight Blue", "storage": "256GB", "connectivity": "5G", "screen": "6.7 inch OLED"},
            },
            {
                "seller_key": "techseller",
                "category": sub_audio,
                "name": "SoundPulse Pro Active Noise-Cancelling Headphones",
                "description": "Custom 40mm neodymium drivers deliver high-resolution audio. Features 40 hours of playtime and dual-mic crystal-clear calls.",
                "price": Decimal("179.99"),
                "compare_at_price": Decimal("229.99"),
                "stock": 80,
                "sku": "TECH-SPP-ANC",
                "is_featured": True,
                "attributes": {"battery_life": "40h", "wireless": True, "anc": True, "color": "Matte Black"},
            },
            {
                "seller_key": "techseller",
                "category": sub_audio,
                "name": "SoundPulse Mini Waterproof Bluetooth Speaker",
                "description": "IPX7 waterproof rating, 360-degree surround sound, and compact carabiner clip design for outdoor adventures and beach trips.",
                "price": Decimal("49.99"),
                "compare_at_price": None,
                "stock": 120,
                "sku": "TECH-SPM-BLU",
                "is_featured": False,
                "attributes": {"waterproof": "IPX7", "weight": "350g", "battery_life": "14h"},
            },
            {
                "seller_key": "techseller",
                "category": sub_wearables,
                "name": "AeroWatch Series 8 Smartwatch",
                "description": "Precision titanium casing with always-on retina display, SpO2 blood oxygen monitoring, ECG heart tracking, and 50m water resistance.",
                "price": Decimal("299.00"),
                "compare_at_price": Decimal("349.00"),
                "stock": 30,
                "sku": "TECH-AW8-TITAN",
                "is_featured": True,
                "attributes": {"case_material": "Titanium", "size": "45mm", "gps": True, "water_resistance": "50m"},
            },
            {
                "seller_key": "techseller",
                "category": sub_wearables,
                "name": "HyperCharge 100W GaN Fast Charger",
                "description": "Next-gen Gallium Nitride (GaN) fast charging station. 3 USB-C and 1 USB-A ports to charge your laptop, tablet, and phone simultaneously.",
                "price": Decimal("39.99"),
                "compare_at_price": Decimal("49.99"),
                "stock": 150,
                "sku": "TECH-GAN-100W",
                "is_featured": False,
                "attributes": {"output": "100W Max", "ports": "3x USB-C, 1x USB-A", "technology": "GaN III"},
            },

            # UrbanWear Studio (Fashion & Apparel)
            {
                "seller_key": "fashionseller",
                "category": sub_streetwear,
                "name": "Classic Heavyweight Organic Cotton Hoodie",
                "description": "Crafted from 100% GOTS-certified organic cotton French terry. Relaxed fit with ribbed cuffs and fleece-lined kangaroo pocket.",
                "price": Decimal("68.00"),
                "compare_at_price": Decimal("85.00"),
                "stock": 60,
                "sku": "URB-HD-01",
                "is_featured": True,
                "attributes": {"material": "100% Organic Cotton", "sizes": ["S", "M", "L", "XL"], "color": "Heather Grey"},
            },
            {
                "seller_key": "fashionseller",
                "category": sub_bags,
                "name": "Everyday Canvas Minimalist Backpack",
                "description": "Weather-resistant 16oz cotton canvas with padded 15.6-inch laptop sleeve, water bottle holder, and quick-access magnetic closures.",
                "price": Decimal("54.50"),
                "compare_at_price": None,
                "stock": 35,
                "sku": "URB-BP-CANVAS",
                "is_featured": False,
                "attributes": {"capacity": "20L", "laptop_compat": "Up to 15.6 inch", "color": "Olive Forest"},
            },
            {
                "seller_key": "fashionseller",
                "category": sub_streetwear,
                "name": "Heritage Raw Denim Workwear Jacket",
                "description": "Japanese selvedge raw indigo denim crafted for natural fading over time. Custom antiqued brass hardware and reinforced stitching.",
                "price": Decimal("110.00"),
                "compare_at_price": Decimal("135.00"),
                "stock": 25,
                "sku": "URB-JK-DENIM",
                "is_featured": True,
                "attributes": {"denim_weight": "14oz Selvedge", "fit": "Boxy Workwear", "color": "Raw Indigo"},
            },
            {
                "seller_key": "fashionseller",
                "category": sub_streetwear,
                "name": "Relaxed Fit Japanese Chino Trousers",
                "description": "Tailored yet casual pleat-front trousers woven from premium twill cotton. Ideal transition piece for office or weekend city walks.",
                "price": Decimal("59.00"),
                "compare_at_price": None,
                "stock": 40,
                "sku": "URB-TR-CHINO",
                "is_featured": False,
                "attributes": {"fabric": "100% Cotton Twill", "cut": "Relaxed Taper", "color": "Sand Dune"},
            },
            {
                "seller_key": "fashionseller",
                "category": sub_footwear,
                "name": "CloudWalk Eco Canvas Low-Top Sneakers",
                "description": "Minimalist trainers made with natural rubber vulcanized soles and recycled memory foam insoles for featherweight cloud cushioning.",
                "price": Decimal("78.00"),
                "compare_at_price": Decimal("95.00"),
                "stock": 50,
                "sku": "URB-SN-ECO",
                "is_featured": True,
                "attributes": {"sole": "100% Natural Rubber", "upper": "Organic Canvas", "color": "Chalk White"},
            },

            # NordicCraft Home (Home & Living)
            {
                "seller_key": "homeseller",
                "category": sub_workspace,
                "name": "Solid Oak Ergonomic Dual-Monitor Desk Stand",
                "description": "Sustainably harvested American White Oak finished with natural beeswax. Elevates displays to eye level and clears valuable desk space.",
                "price": Decimal("74.00"),
                "compare_at_price": Decimal("89.00"),
                "stock": 35,
                "sku": "NOR-DSK-OAK",
                "is_featured": True,
                "attributes": {"wood": "Solid American White Oak", "width": "42 inches", "load_capacity": "60 lbs"},
            },
            {
                "seller_key": "homeseller",
                "category": sub_workspace,
                "name": "Minimalist Dimmable LED Task Lamp",
                "description": "Architectural aluminum construction with touch-slide dimming and 5 adjustable color temperatures from 2700K warm to 6000K daylight.",
                "price": Decimal("44.00"),
                "compare_at_price": None,
                "stock": 70,
                "sku": "NOR-LMP-LED",
                "is_featured": False,
                "attributes": {"lumens": "800lm", "color_temp": "2700K - 6000K", "finish": "Anodized Black"},
            },
            {
                "seller_key": "homeseller",
                "category": sub_dining,
                "name": "Handcrafted Ceramic Pour-Over Coffee Dripper",
                "description": "Individually thrown stoneware ceramic with spiral interior extraction ribs for optimal coffee brewing bloom and clean extraction.",
                "price": Decimal("28.50"),
                "compare_at_price": Decimal("35.00"),
                "stock": 90,
                "sku": "NOR-DRP-CERAM",
                "is_featured": False,
                "attributes": {"material": "Speckled Stoneware", "dishwasher_safe": True, "filter_compat": "V60 02"},
            },
            {
                "seller_key": "homeseller",
                "category": sub_workspace,
                "name": "Ultrasonic Ceramic Aroma Essential Oil Diffuser",
                "description": "Textured matte ceramic cover with whisper-quiet ultrasonic technology. Humidifies air while dispersing organic essential oils.",
                "price": Decimal("38.00"),
                "compare_at_price": Decimal("48.00"),
                "stock": 55,
                "sku": "NOR-DIF-AROMA",
                "is_featured": True,
                "attributes": {"tank_capacity": "180ml", "timer": "3h / 6h / continuous", "ambient_light": True},
            },
            {
                "seller_key": "homeseller",
                "category": sub_workspace,
                "name": "Magnetic Bamboo Cable Organizer Hub",
                "description": "Weighted solid bamboo base with 4 magnetic cable collars to eliminate cord tangles and keep chargers neatly within reach.",
                "price": Decimal("22.00"),
                "compare_at_price": None,
                "stock": 110,
                "sku": "NOR-CBL-BAMBOO",
                "is_featured": False,
                "attributes": {"material": "Carbonized Bamboo & Silicone", "includes": "Base + 4 Collars"},
            },

            # PeakPulse Athletics (Sports & Fitness)
            {
                "seller_key": "sportseller",
                "category": sub_fitness,
                "name": "ProGrip Non-Slip Natural Tree Rubber Yoga Mat",
                "description": "5mm high-density natural tree rubber with laser-etched alignment guides. Uncompromising dry and sweat-wicking grip for intense sessions.",
                "price": Decimal("56.00"),
                "compare_at_price": Decimal("68.00"),
                "stock": 65,
                "sku": "PP-YOGA-MAT",
                "is_featured": True,
                "attributes": {"thickness": "5mm", "material": "Natural Tree Rubber & Polyurethane", "dimensions": "72 x 26 inches"},
            },
            {
                "seller_key": "sportseller",
                "category": sub_fitness,
                "name": "SteelCore Adjustable Speed Jump Rope",
                "description": "Dual 360-degree ball bearings encased in aircraft-grade knurled aluminum handles. Ultra-fast cable for double-unders and HIIT.",
                "price": Decimal("19.50"),
                "compare_at_price": None,
                "stock": 130,
                "sku": "PP-JUMP-ROPE",
                "is_featured": False,
                "attributes": {"cable": "PVC-coated braided steel", "bearings": "Dual 360-degree high-speed"},
            },
            {
                "seller_key": "sportseller",
                "category": sub_outdoors,
                "name": "ThermoVessel 32oz Vacuum-Insulated Water Bottle",
                "description": "Pro-grade 18/8 stainless steel keeps water ice cold for 24 hours or piping hot for 12 hours. Sweat-free powder coat with leakproof chug cap.",
                "price": Decimal("28.00"),
                "compare_at_price": Decimal("36.00"),
                "stock": 85,
                "sku": "PP-BOT-32OZ",
                "is_featured": True,
                "attributes": {"capacity": "32oz (950ml)", "insulation": "Double-Wall TempShield", "bpa_free": True},
            },
            {
                "seller_key": "sportseller",
                "category": sub_fitness,
                "name": "Kinetic Resistance Bands Workout Set (5-Pack)",
                "description": "100% natural Malaysian latex loop bands with calibrated resistance levels from 10 lbs to 50 lbs. Includes breathable carry pouch.",
                "price": Decimal("24.99"),
                "compare_at_price": Decimal("34.99"),
                "stock": 100,
                "sku": "PP-RES-BANDS",
                "is_featured": False,
                "attributes": {"bands_count": 5, "resistance_range": "10 - 50 lbs", "material": "100% Natural Latex"},
            },
            {
                "seller_key": "sportseller",
                "category": sub_outdoors,
                "name": "UltraLight Breathable Running Waist Pack",
                "description": "Bounce-free ergonomic waistband with expandable weather-resistant pocket. Comfortably holds large smartphones, keys, energy gels, and cards.",
                "price": Decimal("22.00"),
                "compare_at_price": None,
                "stock": 70,
                "sku": "PP-WST-PACK",
                "is_featured": False,
                "attributes": {"fit": "Waist 26 - 44 inches", "reflective": True, "water_resistant": True},
            },
        ]

        created_products = {}
        for p in products_catalog:
            store, bg_color, accent_color = stores[p["seller_key"]]
            product, created = Product.objects.get_or_create(
                name=p["name"],
                store=store,
                defaults={
                    "category": p["category"],
                    "description": p["description"],
                    "price": p["price"],
                    "compare_at_price": p.get("compare_at_price"),
                    "stock": p["stock"],
                    "sku": p["sku"],
                    "is_active": True,
                    "is_featured": p.get("is_featured", False),
                    "attributes": p.get("attributes", {}),
                },
            )
            created_products[p["name"]] = product

            # Generate aesthetic product showcase image
            rel_image_path = generate_product_image(
                product.slug,
                product.name,
                store.name,
                bg_color,
                accent_color,
            )
            ProductImage.objects.get_or_create(
                product=product,
                is_primary=True,
                defaults={
                    "image": rel_image_path,
                    "alt_text": product.name,
                    "display_order": 0,
                },
            )

        # -------------------------------------------------------------------
        # 6. Customer Reviews & Ratings
        # -------------------------------------------------------------------
        reviews_data = [
            {
                "product_name": "AeroPhone Ultra 5G (256GB)",
                "user": customer1,
                "rating": 5,
                "title": "Best flagship phone I have ever owned!",
                "comment": "The OLED screen is incredibly bright in outdoor sunlight, and battery easily lasts 1.5 days on heavy usage. Cameras are phenomenal.",
                "is_verified": True,
            },
            {
                "product_name": "SoundPulse Pro Active Noise-Cancelling Headphones",
                "user": customer2,
                "rating": 5,
                "title": "Cuts out all airplane and subway engine noise",
                "comment": "Battery life exceeded my expectations on long transatlantic flights. Memory foam ear cushions are super comfy for all-day wear.",
                "is_verified": True,
            },
            {
                "product_name": "Classic Heavyweight Organic Cotton Hoodie",
                "user": customer1,
                "rating": 5,
                "title": "Heavy, soft, and maintains shape after washing",
                "comment": "You can immediately feel the quality of 100% organic cotton French terry. Fits true to size with a comfortable modern drape.",
                "is_verified": True,
            },
            {
                "product_name": "Solid Oak Ergonomic Dual-Monitor Desk Stand",
                "user": customer2,
                "rating": 5,
                "title": "Stunning craftsmanship and rock-solid stability",
                "comment": "Holding my dual 27-inch monitors easily with zero sag. Solid American white oak has a gorgeous grain and smooth beeswax finish.",
                "is_verified": True,
            },
            {
                "product_name": "ProGrip Non-Slip Natural Tree Rubber Yoga Mat",
                "user": customer1,
                "rating": 4,
                "title": "Superior non-slip grip during sweaty vinyasa",
                "comment": "Unmatched grip even when palms are sweaty. Slight natural rubber scent at first, but completely dissipated after airing out for 2 days.",
                "is_verified": True,
            },
            {
                "product_name": "ThermoVessel 32oz Vacuum-Insulated Water Bottle",
                "user": customer2,
                "rating": 5,
                "title": "Still had ice cubes after 24 hours in hot car",
                "comment": "Built like a tank. The chug cap is completely leakproof in my gym bag and the powder coating doesn't chip or scratch.",
                "is_verified": True,
            },
        ]

        for rev in reviews_data:
            prod = created_products.get(rev["product_name"])
            if prod:
                Review.objects.get_or_create(
                    product=prod,
                    user=rev["user"],
                    defaults={
                        "rating": rev["rating"],
                        "title": rev["title"],
                        "comment": rev["comment"],
                        "is_verified_purchase": rev["is_verified"],
                    },
                )

        # -------------------------------------------------------------------
        # 7. Multi-Vendor Orders (Populate Order History & Seller Portals)
        # -------------------------------------------------------------------
        # Past Order 1: Delivered Multi-Vendor Order (TechZone + UrbanWear)
        p1 = created_products["AeroPhone Ultra 5G (256GB)"]
        p2 = created_products["Classic Heavyweight Organic Cotton Hoodie"]
        total1 = (p1.price * 1) + (p2.price * 2)

        order1, created1 = Order.objects.get_or_create(
            order_number="SN-DEMO-20261001-A1B2",
            defaults={
                "user": customer1,
                "total_amount": total1,
                "status": Order.OrderStatus.COMPLETED,
                "payment_status": Order.PaymentStatus.PAID,
                "payment_method": "credit_card_visa",
                "shipping_full_name": "Jordan Lee",
                "shipping_phone": "+1-555-0144",
                "shipping_address": "742 Evergreen Terrace",
                "shipping_city": "Springfield",
                "shipping_state": "OR",
                "shipping_postal_code": "97477",
                "shipping_country": "United States",
            },
        )
        if created1:
            # Sub-order for TechZone
            so1 = SellerOrder.objects.create(
                order=order1,
                store=p1.store,
                subtotal=p1.price * 1,
                status=SellerOrder.FulfillmentStatus.DELIVERED,
                tracking_number="1Z9999999999999999",
                notes="Delivered to front porch. Signature verified.",
            )
            OrderItem.objects.create(
                seller_order=so1,
                product=p1,
                product_name=p1.name,
                price=p1.price,
                quantity=1,
                line_total=p1.price * 1,
            )

            # Sub-order for UrbanWear
            so2 = SellerOrder.objects.create(
                order=order1,
                store=p2.store,
                subtotal=p2.price * 2,
                status=SellerOrder.FulfillmentStatus.DELIVERED,
                tracking_number="9400100000000000000000",
                notes="Delivered in 100% recyclable poly mailer.",
            )
            OrderItem.objects.create(
                seller_order=so2,
                product=p2,
                product_name=p2.name,
                price=p2.price,
                quantity=2,
                line_total=p2.price * 2,
            )

        # Past Order 2: Processing Multi-Vendor Order (NordicCraft + PeakPulse)
        p3 = created_products["Solid Oak Ergonomic Dual-Monitor Desk Stand"]
        p4 = created_products["ThermoVessel 32oz Vacuum-Insulated Water Bottle"]
        total2 = (p3.price * 1) + (p4.price * 1)

        order2, created2 = Order.objects.get_or_create(
            order_number="SN-DEMO-20261028-C3D4",
            defaults={
                "user": customer1,
                "total_amount": total2,
                "status": Order.OrderStatus.PROCESSING,
                "payment_status": Order.PaymentStatus.PAID,
                "payment_method": "apple_pay",
                "shipping_full_name": "Jordan Lee",
                "shipping_phone": "+1-555-0144",
                "shipping_address": "742 Evergreen Terrace",
                "shipping_city": "Springfield",
                "shipping_state": "OR",
                "shipping_postal_code": "97477",
                "shipping_country": "United States",
            },
        )
        if created2:
            # Sub-order for NordicCraft
            so3 = SellerOrder.objects.create(
                order=order2,
                store=p3.store,
                subtotal=p3.price * 1,
                status=SellerOrder.FulfillmentStatus.PROCESSING,
                notes="Preparing solid oak packaging with corner protectors.",
            )
            OrderItem.objects.create(
                seller_order=so3,
                product=p3,
                product_name=p3.name,
                price=p3.price,
                quantity=1,
                line_total=p3.price * 1,
            )

            # Sub-order for PeakPulse
            so4 = SellerOrder.objects.create(
                order=order2,
                store=p4.store,
                subtotal=p4.price * 1,
                status=SellerOrder.FulfillmentStatus.SHIPPED,
                tracking_number="PP-EXP-884920",
                notes="Handed over to carrier dispatch.",
            )
            OrderItem.objects.create(
                seller_order=so4,
                product=p4,
                product_name=p4.name,
                price=p4.price,
                quantity=1,
                line_total=p4.price * 1,
            )

        # -------------------------------------------------------------------
        # 8. Active Shopping Cart for testcustomer
        # -------------------------------------------------------------------
        cart, _ = Cart.objects.get_or_create(user=customer1)
        cart.clear()
        item_headphones = created_products["SoundPulse Pro Active Noise-Cancelling Headphones"]
        item_diffuser = created_products["Ultrasonic Ceramic Aroma Essential Oil Diffuser"]

        CartItem.objects.create(cart=cart, product=item_headphones, quantity=1)
        CartItem.objects.create(cart=cart, product=item_diffuser, quantity=1)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully seeded ShopNest marketplace!"
                f"\n- 4 Verified Stores: TechZone Direct, UrbanWear Studio, NordicCraft Home, PeakPulse Athletics"
                f"\n- {Product.objects.count()} Active Products with generated 600x600 preview images"
                f"\n- {Review.objects.count()} Verified Customer Reviews"
                f"\n- {Order.objects.count()} Multi-Vendor Orders with {SellerOrder.objects.count()} Sub-Orders"
                f"\n- Active Cart with {cart.total_items} items ready for testcustomer\n"
            )
        )
