import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    # Try Windows Arial or Segoe UI
    font_paths = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def create_snapsplit_1():
    w, h = 1200, 675
    img = Image.new("RGB", (w, h), (14, 17, 23))
    draw = ImageDraw.Draw(img)

    # Top nav bar
    draw.rectangle([0, 0, w, 65], fill=(21, 26, 35))
    draw.line([0, 65, w, 65], fill=(35, 42, 56), width=1)
    
    font_title = get_font(22, True)
    font_sub = get_font(14, False)
    font_tag = get_font(11, True)
    font_small = get_font(13, False)
    font_code = get_font(12, True)

    draw.text((30, 20), "SnapSplit", fill=(56, 189, 248), font=font_title)
    draw.text((140, 25), "• OCR Receipt Extractor & Split Engine", fill=(148, 163, 184), font=font_sub)
    draw.rounded_rectangle([w - 180, 18, w - 30, 48], radius=6, fill=(14, 165, 233))
    draw.text((w - 155, 25), "Upload Receipt", fill=(255, 255, 255), font=get_font(13, True))

    # Left Box: OCR Receipt scanning pane
    draw.rounded_rectangle([30, 95, 520, 630], radius=14, fill=(23, 29, 41), outline=(45, 55, 72), width=1)
    draw.text((50, 115), "ORIGINAL RECEIPT (GOOGLE VISION OCR)", fill=(203, 213, 225), font=get_font(13, True))

    # Receipt paper mockup
    draw.rounded_rectangle([60, 155, 490, 595], radius=8, fill=(253, 251, 247), outline=(226, 232, 240), width=1)
    draw.text((210, 175), "THE CAFE BISTRO", fill=(30, 41, 59), font=get_font(16, True))
    draw.text((220, 198), "New Delhi, India", fill=(100, 116, 139), font=font_small)
    draw.text((90, 225), "Date: 16-Sep-2026   13:42   Table #04", fill=(100, 116, 139), font=font_small)
    draw.line([90, 245, 460, 245], fill=(203, 213, 225), width=1)

    items = [
        ("2x Classic Cold Coffee", "INR 380.00"),
        ("1x Paneer Tikka Platter", "INR 420.00"),
        ("1x Woodfired Margherita Pizza", "INR 540.00"),
        ("2x Chocolate Truffle Pastry", "INR 320.00"),
        ("Subtotal", "INR 1,660.00"),
        ("CGST + SGST (5%)", "INR 83.00"),
        ("Service Charge (10%)", "INR 166.00"),
        ("Grand Total", "INR 1,909.00")
    ]
    y = 265
    for name, val in items:
        is_bold = "Total" in name
        f = get_font(13, is_bold)
        col = (15, 23, 42) if is_bold else (71, 85, 105)
        draw.text((90, y), name, fill=col, font=f)
        draw.text((370, y), val, fill=col, font=f)
        if "Subtotal" in name:
            draw.line([90, y - 6, 460, y - 6], fill=(203, 213, 225), width=1)
        y += 36

    # OCR Bounding Boxes highlight
    draw.rounded_rectangle([75, 260, 475, 400], radius=4, outline=(14, 165, 233), width=2)
    draw.rounded_rectangle([80, 260, 180, 278], radius=3, fill=(14, 165, 233))
    draw.text((85, 263), "Confidence: 99.4%", fill=(255, 255, 255), font=get_font(10, True))

    # Right Box: Dynamic Split Breakdown & Friend Ledgers
    draw.rounded_rectangle([550, 95, 1170, 630], radius=14, fill=(23, 29, 41), outline=(45, 55, 72), width=1)
    draw.text((580, 115), "AUTOMATED ITEMIZATION & SPLIT LEDGER (SUPABASE SYNC)", fill=(203, 213, 225), font=get_font(13, True))

    friends = [
        ("Ayushi Singh (Host)", "Cold Coffee + Margherita Pizza + Taxes", "INR 647.50", (236, 72, 153)),
        ("Rohan Sharma", "Cold Coffee + Paneer Tikka + Taxes", "INR 511.00", (16, 185, 129)),
        ("Sneha Verma", "Paneer Tikka share + Pastry + Taxes", "INR 375.25", (59, 130, 246)),
        ("Vikram Mehta", "Pastry + Beverages + Taxes", "INR 375.25", (245, 158, 11))
    ]

    fy = 160
    for name, desc, amount, color in friends:
        draw.rounded_rectangle([580, fy, 1140, fy + 85], radius=10, fill=(30, 38, 54), outline=(51, 65, 85), width=1)
        # Avatar circle
        draw.ellipse([600, fy + 20, 646, fy + 66], fill=color)
        initials = "".join([part[0] for part in name.split()[:2]])
        draw.text((612, fy + 32), initials, fill=(255, 255, 255), font=get_font(14, True))
        
        draw.text((665, fy + 20), name, fill=(241, 245, 249), font=get_font(15, True))
        draw.text((665, fy + 45), desc, fill=(148, 163, 184), font=font_small)
        
        draw.text((1010, fy + 30), amount, fill=(52, 211, 153), font=get_font(17, True))
        fy += 105

    # Bottom status
    draw.rounded_rectangle([580, fy + 10, 1140, fy + 55], radius=8, fill=(16, 185, 129, 30), outline=(52, 211, 153), width=1)
    draw.text((605, fy + 22), "✔ Google Vision API parsed in 1.4s • Supabase PostgreSQL ledger state synced live", fill=(52, 211, 153), font=get_font(13, True))

    os.makedirs(r"c:\Users\Ikra\OneDrive\Desktop\portfolio\assets", exist_ok=True)
    out_path = r"c:\Users\Ikra\OneDrive\Desktop\portfolio\assets\snapsplit-1.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

def create_snapsplit_2():
    w, h = 1200, 675
    img = Image.new("RGB", (w, h), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, w, 65], fill=(30, 41, 59))
    draw.text((30, 20), "SnapSplit Ledger & Payment Settle", fill=(56, 189, 248), font=get_font(20, True))

    # Metrics row
    metrics = [
        ("TOTAL EXPENSES", "INR 24,850", "+12% this month", (59, 130, 246)),
        ("YOU ARE OWED", "INR 4,320", "from 3 friends", (16, 185, 129)),
        ("YOU OWE", "INR 0.00", "all settled up", (244, 63, 94)),
        ("RECEIPTS SCANNED", "38 Invoices", "99.8% Vision OCR Acc.", (168, 85, 247))
    ]
    mx = 30
    for title, val, sub, col in metrics:
        draw.rounded_rectangle([mx, 95, mx + 265, 205], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
        draw.text((mx + 20, 115), title, fill=(148, 163, 184), font=get_font(11, True))
        draw.text((mx + 20, 140), val, fill=(255, 255, 255), font=get_font(22, True))
        draw.text((mx + 20, 175), sub, fill=col, font=get_font(12, False))
        mx += 290

    # Main Chart & Settlement Log
    draw.rounded_rectangle([30, 230, 750, 630], radius=14, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((50, 250), "MONTHLY EXPENSE DISTRIBUTION BY CATEGORY", fill=(241, 245, 249), font=get_font(14, True))

    # Bar chart simulation
    cats = [("Dining", 420, (236, 72, 153)), ("Groceries", 310, (14, 165, 233)), ("Travel", 220, (245, 158, 11)), ("Rent/Util", 500, (16, 185, 129)), ("Outings", 160, (168, 85, 247))]
    cx = 80
    for name, height, color in cats:
        draw.rounded_rectangle([cx, 550 - height//2, cx + 75, 550], radius=6, fill=color)
        draw.text((cx + 10, 565), name, fill=(148, 163, 184), font=get_font(12, False))
        draw.text((cx + 12, 550 - height//2 - 22), f"{height*15}", fill=(255, 255, 255), font=get_font(12, True))
        cx += 135

    # Right side: Recent Bill settlements
    draw.rounded_rectangle([780, 230, 1170, 630], radius=14, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((805, 250), "INSTANT UPI SETTLEMENT LOG", fill=(241, 245, 249), font=get_font(14, True))

    settlements = [
        ("Weekend Goa Trip Villa", "Settle via GPay", "INR 1,200", "Settled"),
        ("Zomato Dinner Order", "Settle via Paytm", "INR 450", "Settled"),
        ("Groceries Blinkit Split", "Settle via PhonePe", "INR 380", "Pending"),
        ("Starbucks Work Session", "Settle via UPI", "INR 260", "Settled"),
    ]
    sy = 295
    for title, method, amt, status in settlements:
        draw.rounded_rectangle([805, sy, 1145, sy + 65], radius=8, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
        draw.text((820, sy + 14), title, fill=(241, 245, 249), font=get_font(13, True))
        draw.text((820, sy + 36), method, fill=(148, 163, 184), font=get_font(11, False))
        draw.text((1055, sy + 14), amt, fill=(255, 255, 255), font=get_font(13, True))
        st_col = (16, 185, 129) if status == "Settled" else (245, 158, 11)
        draw.text((1060, sy + 36), status, fill=st_col, font=get_font(11, True))
        sy += 80

    out_path = r"c:\Users\Ikra\OneDrive\Desktop\portfolio\assets\snapsplit-2.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

def create_marketing_intelligence_1():
    w, h = 1200, 675
    img = Image.new("RGB", (w, h), (13, 17, 28))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, w, 65], fill=(23, 29, 45))
    draw.text((30, 20), "OmniChannel Intelligence & Behavioral Analytics Engine", fill=(129, 140, 248), font=get_font(20, True))
    draw.rounded_rectangle([w - 200, 16, w - 30, 48], radius=6, fill=(79, 70, 229))
    draw.text((w - 170, 24), "Export Report", fill=(255, 255, 255), font=get_font(13, True))

    # Top KPI Metrics
    kpis = [
        ("OMNICHANNEL TRAFFIC", "1.28M Users", "+18.4% QoQ", (16, 185, 129)),
        ("PREDICTED CLV (AVG)", "$1,420.00", "Machine Learning Model", (129, 140, 248)),
        ("RETENTION RATE", "74.2%", "RFM Champions Segment", (236, 72, 153)),
        ("CHURN RISK PREVENTED", "342 Accounts", "Proactive Email Funnel", (245, 158, 11))
    ]
    kx = 30
    for title, val, sub, col in kpis:
        draw.rounded_rectangle([kx, 95, kx + 265, 205], radius=12, fill=(23, 29, 45), outline=(49, 57, 84), width=1)
        draw.text((kx + 20, 115), title, fill=(148, 163, 184), font=get_font(11, True))
        draw.text((kx + 20, 140), val, fill=(255, 255, 255), font=get_font(22, True))
        draw.text((kx + 20, 175), sub, fill=col, font=get_font(12, False))
        kx += 290

    # Left: RFM Segmentation Grid
    draw.rounded_rectangle([30, 230, 620, 630], radius=14, fill=(23, 29, 45), outline=(49, 57, 84), width=1)
    draw.text((50, 250), "RFM CUSTOMER SEGMENTATION CLUSTERING", fill=(241, 245, 249), font=get_font(14, True))

    segments = [
        ("Champions (High Recency, High Spend)", "28.4% of Revenue", "$480K Total", (16, 185, 129)),
        ("Loyal Customers (Regular Buyers)", "34.1% of Revenue", "$520K Total", (79, 70, 229)),
        ("Potential Loyalists (Recent High Spenders)", "18.2% of Revenue", "$210K Total", (236, 72, 153)),
        ("At-Risk Accounts (Declining Activity)", "12.5% of Revenue", "$140K Total", (245, 158, 11)),
        ("Dormant / Needs Reactivation", "6.8% of Revenue", "$75K Total", (239, 68, 68)),
    ]
    ry = 295
    for title, sub, val, col in segments:
        draw.rounded_rectangle([50, ry, 600, ry + 56], radius=8, fill=(17, 22, 36), outline=(49, 57, 84), width=1)
        draw.ellipse([65, ry + 16, 89, ry + 40], fill=col)
        draw.text((105, ry + 12), title, fill=(241, 245, 249), font=get_font(13, True))
        draw.text((105, ry + 32), sub, fill=(148, 163, 184), font=get_font(11, False))
        draw.text((505, ry + 18), val, fill=(255, 255, 255), font=get_font(13, True))
        ry += 66

    # Right: Multi-channel Funnel Conversion
    draw.rounded_rectangle([650, 230, 1170, 630], radius=14, fill=(23, 29, 45), outline=(49, 57, 84), width=1)
    draw.text((675, 250), "MULTI-TOUCH ATTRIBUTION & CONVERSION FUNNEL", fill=(241, 245, 249), font=get_font(14, True))

    funnels = [
        ("Web Direct & Organic Search", 420, "42,100 Visits • 8.4% Conv."),
        ("Meta & Instagram Ad Campaigns", 340, "31,800 Visits • 6.2% Conv."),
        ("Google Ads Search & Retargeting", 280, "24,500 Visits • 9.8% Conv."),
        ("Email Marketing & Automated Drips", 210, "18,200 Visits • 14.5% Conv."),
        ("Partner Referrals & Influencer", 140, "11,400 Visits • 11.2% Conv."),
    ]
    fy = 300
    for name, bar_w, stat in funnels:
        draw.text((675, fy), name, fill=(241, 245, 249), font=get_font(13, True))
        draw.text((675, fy + 20), stat, fill=(148, 163, 184), font=get_font(11, False))
        draw.rounded_rectangle([675, fy + 40, 1140, fy + 52], radius=4, fill=(17, 22, 36))
        draw.rounded_rectangle([675, fy + 40, 675 + bar_w, fy + 52], radius=4, fill=(129, 140, 248))
        fy += 65

    out_path = r"c:\Users\Ikra\OneDrive\Desktop\portfolio\assets\marketing-1.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

def create_bharatmandi_1():
    w, h = 1200, 675
    img = Image.new("RGB", (w, h), (18, 24, 21))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, w, 65], fill=(28, 38, 33))
    draw.text((30, 20), "BharatMandi — Agri-Commodity Price Intelligence & Mandi Forecast", fill=(74, 222, 128), font=get_font(20, True))
    draw.rounded_rectangle([w - 200, 16, w - 30, 48], radius=6, fill=(34, 197, 94))
    draw.text((w - 170, 24), "UP & NCR Mandis", fill=(255, 255, 255), font=get_font(13, True))

    # Top stats
    stats = [
        ("MANDIS MONITORED", "48 Mandis", "Ghaziabad, Meerut, Hapur", (74, 222, 128)),
        ("COMMODITIES TRACKED", "120+ Crops", "Wheat, Paddy, Mustard, Potato", (56, 189, 248)),
        ("PRICE VOLATILITY ALERT", "Mustard (Sarson)", "+6.4% in Hapur Mandi", (245, 158, 11)),
        ("FORECAST ACCURACY", "94.8%", "FastAPI ARIMA Time-Series", (236, 72, 153))
    ]
    bx = 30
    for title, val, sub, col in stats:
        draw.rounded_rectangle([bx, 95, bx + 265, 205], radius=12, fill=(28, 38, 33), outline=(47, 66, 56), width=1)
        draw.text((bx + 20, 115), title, fill=(148, 163, 184), font=get_font(11, True))
        draw.text((bx + 20, 140), val, fill=(255, 255, 255), font=get_font(22, True))
        draw.text((bx + 20, 175), sub, fill=col, font=get_font(12, False))
        bx += 290

    # Live Mandi Rates Table
    draw.rounded_rectangle([30, 230, 680, 630], radius=14, fill=(28, 38, 33), outline=(47, 66, 56), width=1)
    draw.text((50, 250), "LIVE WHOLESALE RATES (AGMARKNET SYNCED)", fill=(241, 245, 249), font=get_font(14, True))

    rates = [
        ("Wheat (Gehun)", "Sahibabad Mandi, Ghaziabad", "INR 2,420 / Qtl", "+1.2%", (74, 222, 128)),
        ("Basmati Paddy (Dhan)", "Meerut Mandi", "INR 3,650 / Qtl", "+2.8%", (74, 222, 128)),
        ("Mustard (Sarson)", "Hapur Mandi", "INR 5,820 / Qtl", "+6.4%", (74, 222, 128)),
        ("Potato (Aloo)", "Naveen Mandi, Ghaziabad", "INR 1,280 / Qtl", "-1.5%", (239, 68, 68)),
        ("Sugarcane (Ganna)", "Modinagar Center", "INR 390 / Qtl", "Stable", (148, 163, 184)),
    ]
    my = 295
    for crop, mandi, rate, trend, col in rates:
        draw.rounded_rectangle([50, my, 660, my + 56], radius=8, fill=(20, 28, 24), outline=(47, 66, 56), width=1)
        draw.text((70, my + 10), crop, fill=(255, 255, 255), font=get_font(14, True))
        draw.text((70, my + 32), mandi, fill=(156, 163, 175), font=get_font(11, False))
        draw.text((470, my + 12), rate, fill=(241, 245, 249), font=get_font(14, True))
        draw.text((470, my + 32), trend, fill=col, font=get_font(11, True))
        my += 66

    # Seasonal Price Forecast Chart
    draw.rounded_rectangle([710, 230, 1170, 630], radius=14, fill=(28, 38, 33), outline=(47, 66, 56), width=1)
    draw.text((735, 250), "30-DAY PRICE FORECAST & HARVEST TIMELINE", fill=(241, 245, 249), font=get_font(14, True))

    # Trend visual
    points = [(740, 520), (810, 490), (880, 510), (950, 440), (1020, 410), (1090, 370), (1140, 350)]
    for i in range(len(points)-1):
        draw.line([points[i], points[i+1]], fill=(74, 222, 128), width=3)
        draw.ellipse([points[i][0]-4, points[i][1]-4, points[i][0]+4, points[i][1]+4], fill=(255, 255, 255))
    draw.ellipse([points[-1][0]-4, points[-1][1]-4, points[-1][0]+4, points[-1][1]+4], fill=(255, 255, 255))

    draw.text((740, 560), "Sep 16", fill=(156, 163, 175), font=get_font(11, False))
    draw.text((880, 560), "Sep 30", fill=(156, 163, 175), font=get_font(11, False))
    draw.text((1020, 560), "Oct 15", fill=(156, 163, 175), font=get_font(11, False))

    draw.rounded_rectangle([740, 290, 1140, 340], radius=8, fill=(20, 28, 24))
    draw.text((755, 305), "Recommendation: Hold Sarson inventory for 2 weeks for optimal margins.", fill=(74, 222, 128), font=get_font(12, True))

    out_path = r"c:\Users\Ikra\OneDrive\Desktop\portfolio\assets\bharatmandi-1.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

if __name__ == "__main__":
    create_snapsplit_1()
    create_snapsplit_2()
    create_marketing_intelligence_1()
    create_bharatmandi_1()
