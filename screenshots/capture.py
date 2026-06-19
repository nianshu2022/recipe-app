from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # iPhone 14 Pro viewport
    page = browser.new_page(viewport={"width": 393, "height": 852}, device_scale_factor=3)
    
    # Home page
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/home.png', full_page=True)
    
    # Blind box page
    page.goto('http://localhost:5173/blind-box')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/blind-box.png', full_page=True)
    
    # Meal plan page
    page.goto('http://localhost:5173/meal-plan')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/meal-plan.png', full_page=True)
    
    # Collection page
    page.goto('http://localhost:5173/collection')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/collection.png', full_page=True)
    
    # Settings page
    page.goto('http://localhost:5173/settings')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/settings.png', full_page=True)
    
    # Shopping page
    page.goto('http://localhost:5173/shopping')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path='D:/project/nianshu/recipe-app/screenshots/shopping.png', full_page=True)
    
    browser.close()
    print("Screenshots saved!")
