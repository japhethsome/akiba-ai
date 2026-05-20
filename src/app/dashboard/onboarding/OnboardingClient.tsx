"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { completeOnboarding, OnboardingProduct } from "@/lib/actions/onboarding";

// ─── AI Inventory Templates ───────────────────────────────────────────────────
const TEMPLATES: Record<string, { label: string; sw: string; icon: string; products: OnboardingProduct[] }> = {
  grocery: {
    label: "Grocery / Mama Mboga", sw: "Mboga & Matunda", icon: "local_grocery_store",
    products: [
      { name: "Sukuma Wiki (Bunch)", category: "Vegetables", unit_price: 20, stock_quantity: 100, reorder_level: 20 },
      { name: "Spinach (Bunch)", category: "Vegetables", unit_price: 25, stock_quantity: 80, reorder_level: 15 },
      { name: "Tomatoes 1kg", category: "Vegetables", unit_price: 120, stock_quantity: 30, reorder_level: 8 },
      { name: "Onions 1kg", category: "Vegetables", unit_price: 130, stock_quantity: 25, reorder_level: 5 },
      { name: "Ripe Bananas (Bunch)", category: "Fruits", unit_price: 150, stock_quantity: 15, reorder_level: 3 },
      { name: "Avocado (Medium)", category: "Fruits", unit_price: 30, stock_quantity: 40, reorder_level: 10 },
    ],
  },
  duka: {
    label: "Small Duka / Kiosk", sw: "Duka la Rejareja", icon: "storefront",
    products: [
      { name: "Jogoo Unga 2kg", category: "Flour", unit_price: 165, stock_quantity: 50, reorder_level: 15 },
      { name: "Sugar 1kg (Mumias)", category: "Sugar", unit_price: 145, stock_quantity: 40, reorder_level: 10 },
      { name: "Cooking Oil 1L (Elianto)", category: "Oil", unit_price: 220, stock_quantity: 30, reorder_level: 8 },
      { name: "Safari Pure Tea 250g", category: "Tea", unit_price: 120, stock_quantity: 25, reorder_level: 5 },
      { name: "Broadways Bread", category: "Bread", unit_price: 55, stock_quantity: 20, reorder_level: 5 },
      { name: "Blue Band 250g", category: "Spreads", unit_price: 115, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  supermarket: {
    label: "Mini Supermarket", sw: "Supermarket Ndogo", icon: "shopping_cart",
    products: [
      { name: "Unga wa Dola 2kg", category: "Flour", unit_price: 170, stock_quantity: 50, reorder_level: 15 },
      { name: "Sugar 2kg (Kabras)", category: "Sugar", unit_price: 280, stock_quantity: 40, reorder_level: 10 },
      { name: "Cooking Oil 2L (Salit)", category: "Oil", unit_price: 450, stock_quantity: 30, reorder_level: 8 },
      { name: "Detergent Powder 1kg", category: "Cleaning", unit_price: 220, stock_quantity: 20, reorder_level: 5 },
      { name: "Bar Soap (White Star)", category: "Cleaning", unit_price: 150, stock_quantity: 25, reorder_level: 5 },
      { name: "Long Life Milk 1L", category: "Dairy", unit_price: 110, stock_quantity: 35, reorder_level: 10 },
    ],
  },
  wholesale: {
    label: "Wholesale & Distributor", sw: "Duka la Jumla", icon: "inventory",
    products: [
      { name: "Bale of Unga 2kg (12pcs)", category: "Bulk Flour", unit_price: 1900, stock_quantity: 20, reorder_level: 5 },
      { name: "Carton of Cooking Oil 1L (12pcs)", category: "Bulk Oil", unit_price: 2500, stock_quantity: 15, reorder_level: 4 },
      { name: "Bag of Sugar 50kg", category: "Bulk Sugar", unit_price: 6500, stock_quantity: 10, reorder_level: 3 },
      { name: "Box of Bar Soap (10pcs)", category: "Bulk Cleaning", unit_price: 1300, stock_quantity: 15, reorder_level: 4 },
      { name: "Sack of Rice 25kg", category: "Bulk Rice", unit_price: 320, stock_quantity: 25, reorder_level: 5 },
    ],
  },
  market_stall: {
    label: "Market Stall / Vendor", sw: "Kibanda cha Soko", icon: "store",
    products: [
      { name: "Onions (1 Net)", category: "Vegetables", unit_price: 180, stock_quantity: 10, reorder_level: 3 },
      { name: "Tomatoes (Crate half)", category: "Vegetables", unit_price: 500, stock_quantity: 12, reorder_level: 3 },
      { name: "Potatoes (Sack half)", category: "Vegetables", unit_price: 1200, stock_quantity: 8, reorder_level: 2 },
      { name: "Garlic 1kg", category: "Vegetables", unit_price: 250, stock_quantity: 15, reorder_level: 4 },
      { name: "Cabbage (Medium)", category: "Vegetables", unit_price: 50, stock_quantity: 30, reorder_level: 10 },
    ],
  },
  chemist: {
    label: "Chemist / Pharmacy", sw: "Duka la Dawa", icon: "medication",
    products: [
      { name: "Panadol Actifast 24s", category: "Painkillers", unit_price: 95, stock_quantity: 60, reorder_level: 15 },
      { name: "Band-Aid Box 20s", category: "First Aid", unit_price: 85, stock_quantity: 40, reorder_level: 10 },
      { name: "Antiseptic Liquid 500ml", category: "Antiseptics", unit_price: 180, stock_quantity: 25, reorder_level: 5 },
      { name: "Vitamin C 1000mg 30s", category: "Vitamins", unit_price: 350, stock_quantity: 30, reorder_level: 8 },
      { name: "Cough Syrup 100ml", category: "Cough & Cold", unit_price: 120, stock_quantity: 20, reorder_level: 5 },
      { name: "ORS Sachet (Lemon)", category: "Rehydration", unit_price: 30, stock_quantity: 80, reorder_level: 20 },
    ],
  },
  agrovet: {
    label: "Agro-vet Shop", sw: "Duka la Shamba", icon: "grass",
    products: [
      { name: "DAP Fertilizer 10kg", category: "Fertilizer", unit_price: 2800, stock_quantity: 20, reorder_level: 5 },
      { name: "Maize Seeds 2kg (H614D)", category: "Seeds", unit_price: 450, stock_quantity: 30, reorder_level: 8 },
      { name: "Cattle Mineral Lick 5kg", category: "Animal Feed", unit_price: 650, stock_quantity: 15, reorder_level: 4 },
      { name: "Pesticide Spray 1L", category: "Pesticides", unit_price: 780, stock_quantity: 20, reorder_level: 5 },
      { name: "Poultry Starter Feed 10kg", category: "Animal Feed", unit_price: 1100, stock_quantity: 15, reorder_level: 3 },
      { name: "Urea Fertilizer 10kg", category: "Fertilizer", unit_price: 2200, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  hardware: {
    label: "Hardware Store", sw: "Vifaa vya Ujenzi", icon: "construction",
    products: [
      { name: "Cement 50kg (Bamburi)", category: "Cement", unit_price: 900, stock_quantity: 100, reorder_level: 20 },
      { name: "Steel Nails 2-inch (1kg)", category: "Nails", unit_price: 120, stock_quantity: 60, reorder_level: 15 },
      { name: "Gloss Paint 4L", category: "Paint", unit_price: 1100, stock_quantity: 20, reorder_level: 5 },
      { name: "G-Clamp 6-inch", category: "Clamps", unit_price: 350, stock_quantity: 15, reorder_level: 3 },
      { name: "Key Lock (Standard)", category: "Locks", unit_price: 280, stock_quantity: 25, reorder_level: 5 },
      { name: "Hammer (Steel Head)", category: "Tools", unit_price: 450, stock_quantity: 12, reorder_level: 3 },
    ],
  },
  restaurant: {
    label: "Restaurant / Cafe", sw: "Hoteli & Kahawa", icon: "restaurant",
    products: [
      { name: "Beef Stew Portion", category: "Meals", unit_price: 250, stock_quantity: 50, reorder_level: 5 },
      { name: "Chicken Biryani", category: "Meals", unit_price: 350, stock_quantity: 40, reorder_level: 5 },
      { name: "Ugali Saucer", category: "Meals", unit_price: 50, stock_quantity: 100, reorder_level: 10 },
      { name: "Soft Drink 500ml", category: "Beverages", unit_price: 70, stock_quantity: 60, reorder_level: 10 },
      { name: "Chapati (Single)", category: "Meals", unit_price: 30, stock_quantity: 80, reorder_level: 15 },
    ],
  },
  food_kiosk: {
    label: "Food Kiosk / Chapati", sw: "Kibanda cha Chapati", icon: "soup_kitchen",
    products: [
      { name: "Plain Chapati", category: "Meals", unit_price: 30, stock_quantity: 100, reorder_level: 15 },
      { name: "Beef Stew Portion", category: "Meals", unit_price: 120, stock_quantity: 30, reorder_level: 5 },
      { name: "Madondo (Beans)", category: "Meals", unit_price: 50, stock_quantity: 40, reorder_level: 8 },
      { name: "Ndengu (Greengrams)", category: "Meals", unit_price: 60, stock_quantity: 45, reorder_level: 8 },
      { name: "Hot Tea (Cup)", category: "Beverages", unit_price: 20, stock_quantity: 200, reorder_level: 10 },
    ],
  },
  bakery: {
    label: "Bakery", sw: "Duka la Mikate", icon: "bakery_dining",
    products: [
      { name: "Sliced White Bread", category: "Bakery", unit_price: 60, stock_quantity: 30, reorder_level: 5 },
      { name: "Sliced Brown Bread", category: "Bakery", unit_price: 70, stock_quantity: 20, reorder_level: 5 },
      { name: "Queen Cakes (6pcs)", category: "Pastries", unit_price: 150, stock_quantity: 15, reorder_level: 3 },
      { name: "Chocolate Cake Slice", category: "Pastries", unit_price: 120, stock_quantity: 25, reorder_level: 5 },
      { name: "Birthday Cake 1kg", category: "Cakes", unit_price: 1500, stock_quantity: 5, reorder_level: 1 },
    ],
  },
  bar: {
    label: "Bar & Liquor Store", sw: "Baa & Vileo", icon: "local_bar",
    products: [
      { name: "Tusker Lager 500ml", category: "Beers", unit_price: 220, stock_quantity: 120, reorder_level: 24 },
      { name: "Guinness Stout 500ml", category: "Beers", unit_price: 250, stock_quantity: 60, reorder_level: 12 },
      { name: "White Cap Lager 500ml", category: "Beers", unit_price: 220, stock_quantity: 80, reorder_level: 24 },
      { name: "Local Gin 750ml", category: "Spirits", unit_price: 800, stock_quantity: 15, reorder_level: 3 },
      { name: "Scotch Whiskey 750ml", category: "Spirits", unit_price: 1800, stock_quantity: 10, reorder_level: 2 },
    ],
  },
  salon: {
    label: "Salon & Barbershop", sw: "Kinyozi & Saluni", icon: "content_cut",
    products: [
      { name: "Standard Hair Cut", category: "Services", unit_price: 150, stock_quantity: 999, reorder_level: 0 },
      { name: "Hair Braiding Service", category: "Services", unit_price: 1200, stock_quantity: 999, reorder_level: 0 },
      { name: "Shaving Blades (Box)", category: "Tools", unit_price: 120, stock_quantity: 40, reorder_level: 10 },
      { name: "Hair Pomade 150g", category: "Haircare", unit_price: 180, stock_quantity: 20, reorder_level: 4 },
      { name: "Hair Gel 250g", category: "Haircare", unit_price: 200, stock_quantity: 30, reorder_level: 8 },
    ],
  },
  cosmetics: {
    label: "Cosmetics & Beauty", sw: "Vipodozi", icon: "brush",
    products: [
      { name: "Face Foundation Cream", category: "Makeup", unit_price: 450, stock_quantity: 15, reorder_level: 3 },
      { name: "Matte Lipstick", category: "Makeup", unit_price: 300, stock_quantity: 25, reorder_level: 5 },
      { name: "Coconut Body Lotion 400ml", category: "Skincare", unit_price: 350, stock_quantity: 20, reorder_level: 5 },
      { name: "Nail Polish Remover", category: "Nails", unit_price: 120, stock_quantity: 30, reorder_level: 5 },
      { name: "Makeup Sponge Set", category: "Accessories", unit_price: 150, stock_quantity: 20, reorder_level: 4 },
    ],
  },
  boutique: {
    label: "Boutique / Clothing", sw: "Duka la Nguo", icon: "checkroom",
    products: [
      { name: "Men's T-Shirt (S-XL)", category: "Tops", unit_price: 650, stock_quantity: 30, reorder_level: 5 },
      { name: "Ladies Blouse", category: "Tops", unit_price: 850, stock_quantity: 20, reorder_level: 5 },
      { name: "Denim Jeans (Unisex)", category: "Bottoms", unit_price: 1500, stock_quantity: 15, reorder_level: 3 },
      { name: "Kitenge Dress", category: "Dresses", unit_price: 1200, stock_quantity: 10, reorder_level: 3 },
      { name: "Sandals (Size 36-44)", category: "Footwear", unit_price: 950, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  tailoring: {
    label: "Tailoring Shop", sw: "Duka la Kushona", icon: "content_cut",
    products: [
      { name: "Custom Kitenge Stitching", category: "Services", unit_price: 1500, stock_quantity: 999, reorder_level: 0 },
      { name: "Dress Repair / Hemming", category: "Services", unit_price: 150, stock_quantity: 999, reorder_level: 0 },
      { name: "Polyester Thread Roll", category: "Materials", unit_price: 50, stock_quantity: 60, reorder_level: 10 },
      { name: "Buttons Pack (50pcs)", category: "Materials", unit_price: 100, stock_quantity: 25, reorder_level: 5 },
      { name: "Tailoring Scissors 9-inch", category: "Tools", unit_price: 450, stock_quantity: 5, reorder_level: 1 },
    ],
  },
  electronics: {
    label: "Mobile & Electronics", sw: "Simu & Elektroni", icon: "smartphone",
    products: [
      { name: "USB Type-C Cable", category: "Accessories", unit_price: 200, stock_quantity: 40, reorder_level: 8 },
      { name: "Smart Earphones (Wired)", category: "Audio", unit_price: 350, stock_quantity: 25, reorder_level: 5 },
      { name: "Power Bank 10,000mAh", category: "Power", unit_price: 1200, stock_quantity: 15, reorder_level: 3 },
      { name: "Tempered Glass Protector", category: "Screens", unit_price: 150, stock_quantity: 50, reorder_level: 10 },
      { name: "Smartphone Charger 18W", category: "Power", unit_price: 600, stock_quantity: 20, reorder_level: 4 },
    ],
  },
  spare_parts: {
    label: "Spare Parts Shop", sw: "Vipuri vya Magari", icon: "settings_suggest",
    products: [
      { name: "Engine Oil 1L (Shell)", category: "Lubricants", unit_price: 850, stock_quantity: 20, reorder_level: 5 },
      { name: "Motorcycle Spark Plug", category: "Spares", unit_price: 180, stock_quantity: 30, reorder_level: 8 },
      { name: "Brake Pads Set", category: "Spares", unit_price: 450, stock_quantity: 15, reorder_level: 3 },
      { name: "Tube Size 18", category: "Tires", unit_price: 350, stock_quantity: 25, reorder_level: 5 },
      { name: "Side Mirror Pair", category: "Spares", unit_price: 500, stock_quantity: 10, reorder_level: 2 },
    ],
  },
  logistics: {
    label: "Logistics & Courier", sw: "Uwasilishaji", icon: "local_shipping",
    products: [
      { name: "Envelope A4 (10pcs)", category: "Stationery", unit_price: 100, stock_quantity: 50, reorder_level: 10 },
      { name: "Packaging Tape Roll", category: "Packaging", unit_price: 150, stock_quantity: 30, reorder_level: 5 },
      { name: "Bubble Wrap 5m", category: "Packaging", unit_price: 300, stock_quantity: 10, reorder_level: 2 },
      { name: "Cardboard Box Medium", category: "Packaging", unit_price: 120, stock_quantity: 25, reorder_level: 5 },
      { name: "Delivery Receipt Book", category: "Stationery", unit_price: 150, stock_quantity: 15, reorder_level: 3 },
    ],
  },
  boda: {
    label: "Boda Boda Dispatch", sw: "Boda Boda Courier", icon: "two_wheeler",
    products: [
      { name: "Rider Safety Helmet", category: "Safety", unit_price: 1500, stock_quantity: 10, reorder_level: 2 },
      { name: "Reflective Safety Vest", category: "Safety", unit_price: 250, stock_quantity: 20, reorder_level: 5 },
      { name: "Phone Handle Mount", category: "Accessories", unit_price: 400, stock_quantity: 15, reorder_level: 3 },
      { name: "Key Ring Strap", category: "Accessories", unit_price: 50, stock_quantity: 50, reorder_level: 10 },
      { name: "Raincoat Suit", category: "Safety", unit_price: 800, stock_quantity: 8, reorder_level: 2 },
    ],
  },
  construction_materials: {
    label: "Construction Material", sw: "Vifaa vya Mijengo", icon: "foundation",
    products: [
      { name: "Ballast (per Wheelbarrow)", category: "Materials", unit_price: 200, stock_quantity: 50, reorder_level: 10 },
      { name: "Sand (per Wheelbarrow)", category: "Materials", unit_price: 150, stock_quantity: 50, reorder_level: 10 },
      { name: "Iron Sheet 10ft", category: "Roofing", unit_price: 1200, stock_quantity: 30, reorder_level: 5 },
      { name: "Timber 2x2 (per foot)", category: "Timber", unit_price: 45, stock_quantity: 200, reorder_level: 50 },
      { name: "Wire Mesh Roll", category: "Fencing", unit_price: 3500, stock_quantity: 5, reorder_level: 1 },
    ],
  },
  cyber_cafe: {
    label: "Cyber Café & Printing", sw: "Cyber & Uchapishaji", icon: "computer",
    products: [
      { name: "A4 Black/White Printing", category: "Services", unit_price: 10, stock_quantity: 999, reorder_level: 0 },
      { name: "A4 Color Printing", category: "Services", unit_price: 30, stock_quantity: 999, reorder_level: 0 },
      { name: "A4 Photocopying", category: "Services", unit_price: 5, stock_quantity: 999, reorder_level: 0 },
      { name: "Lamination A4", category: "Services", unit_price: 100, stock_quantity: 999, reorder_level: 0 },
      { name: "Cyber Internet Session 1hr", category: "Services", unit_price: 50, stock_quantity: 999, reorder_level: 0 },
    ],
  },
  guesthouse: {
    label: "Guesthouse & Lodging", sw: "Guesthouse & Lodging", icon: "bed",
    products: [
      { name: "Single Room (Per Night)", category: "Rooms", unit_price: 1500, stock_quantity: 15, reorder_level: 2 },
      { name: "Double Room (Per Night)", category: "Rooms", unit_price: 2500, stock_quantity: 10, reorder_level: 2 },
      { name: "Basic Toiletries Kit", category: "Toiletries", unit_price: 100, stock_quantity: 50, reorder_level: 10 },
      { name: "Laundry Service (Per Load)", category: "Services", unit_price: 300, stock_quantity: 999, reorder_level: 0 },
      { name: "Room Slippers Pair", category: "Accessories", unit_price: 150, stock_quantity: 30, reorder_level: 5 },
    ],
  },
  dairy: {
    label: "Dairy Shop & Milk Vendor", sw: "Duka la Maziwa", icon: "water_drop",
    products: [
      { name: "Fresh Milk 1L (Dispensed)", category: "Dairy", unit_price: 70, stock_quantity: 150, reorder_level: 30 },
      { name: "Mala (Sour Milk) 500ml", category: "Dairy", unit_price: 60, stock_quantity: 40, reorder_level: 10 },
      { name: "Yogurt Strawberry 250ml", category: "Dairy", unit_price: 80, stock_quantity: 50, reorder_level: 10 },
      { name: "Cheese Block 250g", category: "Dairy", unit_price: 350, stock_quantity: 15, reorder_level: 3 },
      { name: "Dispensed Milk Jug 1L", category: "Containers", unit_price: 150, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  manufacturer: {
    label: "Small Manufacturer", sw: "Kiwanda Kidogo", icon: "build",
    products: [
      { name: "Raw Soap Base 1kg", category: "Raw Materials", unit_price: 250, stock_quantity: 40, reorder_level: 10 },
      { name: "Liquid Detergent 5L", category: "Finished Goods", unit_price: 600, stock_quantity: 20, reorder_level: 5 },
      { name: "Wooden Chair (Finished)", category: "Finished Goods", unit_price: 1800, stock_quantity: 10, reorder_level: 2 },
      { name: "Bar Soap Mould", category: "Equipment", unit_price: 450, stock_quantity: 5, reorder_level: 1 },
      { name: "Packaging Bottle 1L", category: "Packaging", unit_price: 15, stock_quantity: 200, reorder_level: 30 },
    ],
  },
  other: {
    label: "Other Business / Custom", sw: "Biashara Nyingine", icon: "storefront",
    products: [
      { name: "Custom Item 1", category: "General", unit_price: 100, stock_quantity: 20, reorder_level: 5 },
      { name: "Custom Item 2", category: "General", unit_price: 200, stock_quantity: 20, reorder_level: 5 },
      { name: "Custom Item 3", category: "General", unit_price: 300, stock_quantity: 20, reorder_level: 5 },
    ],
  },
};

const AI_MESSAGES = [
  "Analyzing East African retail demand patterns...",
  "Running Monte Carlo inventory simulations...",
  "Mapping safety stock thresholds for your category...",
  "Configuring AI reorder triggers in Kiswahili...",
  "Calibrating profit margin alerts...",
  "Building your personalized demand forecast model...",
];

type Lang = "en" | "sw";
type CategoryKey = keyof typeof TEMPLATES;

interface Props { storeId: string; storeName: string; ownerName: string; }

export default function OnboardingClient({ storeName, ownerName }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [products, setProducts] = useState<OnboardingProduct[]>([]);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [aiMsgIdx, setAiMsgIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sw = lang === "sw";

  // Load template products
  const loadTemplate = (key: CategoryKey) => {
    if (key === "other" && customCategory.trim()) {
      const query = customCategory.toLowerCase();
      let customProducts: OnboardingProduct[] = [];
      
      if (query.includes("bake") || query.includes("cake") || query.includes("bread") || query.includes("pastry") || query.includes("baker")) {
        customProducts = [
          { name: "White Bread Loaf", category: "Bakery", unit_price: 60, stock_quantity: 30, reorder_level: 5 },
          { name: "Wheat Bread Loaf", category: "Bakery", unit_price: 70, stock_quantity: 20, reorder_level: 5 },
          { name: "Queen Cakes (6s)", category: "Pastries", unit_price: 150, stock_quantity: 15, reorder_level: 3 },
          { name: "Baking Flour 2kg", category: "Ingredients", unit_price: 180, stock_quantity: 25, reorder_level: 5 },
        ];
      } else if (query.includes("salon") || query.includes("barber") || query.includes("hair") || query.includes("beauty") || query.includes("cosmetic")) {
        customProducts = [
          { name: "Hair Shampoo 500ml", category: "Hair Care", unit_price: 250, stock_quantity: 20, reorder_level: 5 },
          { name: "Hair Conditioner 500ml", category: "Hair Care", unit_price: 300, stock_quantity: 15, reorder_level: 3 },
          { name: "Styling Gel 250g", category: "Hair Care", unit_price: 150, stock_quantity: 30, reorder_level: 8 },
          { name: "Hair Spray 400ml", category: "Cosmetics", unit_price: 450, stock_quantity: 20, reorder_level: 5 },
        ];
      } else if (query.includes("cyber") || query.includes("cafe") || query.includes("print") || query.includes("stationery") || query.includes("book")) {
        customProducts = [
          { name: "A4 Printing Paper (Ream)", category: "Stationery", unit_price: 750, stock_quantity: 15, reorder_level: 3 },
          { name: "Black Pen (Bic)", category: "Pens", unit_price: 15, stock_quantity: 100, reorder_level: 20 },
          { name: "Exercise Book A5", category: "Books", unit_price: 45, stock_quantity: 50, reorder_level: 10 },
          { name: "Clear Folder", category: "Stationery", unit_price: 30, stock_quantity: 80, reorder_level: 15 },
        ];
      } else if (query.includes("electron") || query.includes("phone") || query.includes("repair") || query.includes("cable") || query.includes("charge") || query.includes("comp")) {
        customProducts = [
          { name: "USB Type-C Cable", category: "Accessories", unit_price: 200, stock_quantity: 40, reorder_level: 8 },
          { name: "Micro USB Cable", category: "Accessories", unit_price: 150, stock_quantity: 30, reorder_level: 6 },
          { name: "Smart Earphones (wired)", category: "Audio", unit_price: 350, stock_quantity: 25, reorder_level: 5 },
          { name: "Tempered Glass Protector", category: "Screens", unit_price: 150, stock_quantity: 50, reorder_level: 10 },
        ];
      } else if (query.includes("boda") || query.includes("bike") || query.includes("spare") || query.includes("car") || query.includes("auto") || query.includes("mechanic")) {
        customProducts = [
          { name: "Engine Oil 1L (Shell)", category: "Lubricants", unit_price: 850, stock_quantity: 20, reorder_level: 5 },
          { name: "Spark Plug (Standard)", category: "Spares", unit_price: 180, stock_quantity: 30, reorder_level: 8 },
          { name: "Brake Pads (Set)", category: "Spares", unit_price: 450, stock_quantity: 15, reorder_level: 3 },
          { name: "Tube (Size 18)", category: "Tires", unit_price: 350, stock_quantity: 25, reorder_level: 5 },
        ];
      } else {
        customProducts = [
          { name: "Custom Item 1", category: "General", unit_price: 100, stock_quantity: 20, reorder_level: 5 },
          { name: "Custom Item 2", category: "General", unit_price: 200, stock_quantity: 20, reorder_level: 5 },
          { name: "Custom Item 3", category: "General", unit_price: 300, stock_quantity: 20, reorder_level: 5 },
        ];
      }
      setProducts(customProducts);
    } else {
      setProducts(TEMPLATES[key].products.map(p => ({ ...p })));
    }
    setTemplateLoaded(true);
  };

  const updateProduct = (idx: number, field: keyof OnboardingProduct, value: string | number) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removeProduct = (idx: number) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const addProduct = () => {
    setProducts(prev => [...prev, { name: "", category: category ? TEMPLATES[category].label : "General", unit_price: 0, stock_quantity: 0, reorder_level: 5 }]);
  };

  // Step 2 → Step 3: run AI animation then submit
  const handleFinish = async () => {
    if (!category) return;
    if (products.length < 1) { setError(sw ? "Ongeza bidhaa angalau 1" : "Add at least 1 product"); return; }
    setStep(3);
    setSubmitting(true);
    setError(null);

    // Cycle AI messages
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % AI_MESSAGES.length;
      setAiMsgIdx(idx);
    }, 900);

    const storeCategoryStr = category === "other" ? (customCategory.trim() || "Other") : TEMPLATES[category].label;
    const result = await completeOnboarding(storeCategoryStr, products);
    clearInterval(interval);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setStep(2);
      return;
    }
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-[#0b120e] flex flex-col" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <span className="text-white font-black text-lg">
          Akiba<span style={{ color: "#4ade80" }}>AI</span>
        </span>
        <div className="flex bg-white/10 p-1 rounded-full gap-1">
          {(["en", "sw"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${lang === l ? "bg-[#00a87a] text-white" : "text-white/50"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-5 pt-5">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#00a87a]" : "bg-white/10"}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Choose Category ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                <div>
                  <p className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-1">{sw ? "Hatua 1 kati ya 3" : "Step 1 of 3"}</p>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {sw ? `Karibu, ${ownerName}!` : `Welcome, ${ownerName}!`}
                  </h1>
                  <p className="text-white/50 mt-2 text-sm">
                    {sw ? "Duka lako linafanya biashara gani?" : `What type of business is "${storeName}"?`}
                  </p>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={sw ? "Tafuta aina ya biashara (k.v. Duka, Kinyozi, Cyber)..." : "Search business type (e.g. Duka, Barber, Cyber)..."}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-11 pr-4 text-white text-xs font-bold outline-none focus:border-[#00a87a] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {(() => {
                    const filtered = (Object.keys(TEMPLATES) as CategoryKey[]).filter(key => {
                      if (key === "other") return true; // Always show "Other"
                      const t = TEMPLATES[key];
                      const q = searchQuery.toLowerCase();
                      return t.label.toLowerCase().includes(q) || t.sw.toLowerCase().includes(q);
                    });

                    // Put "other" at the very end
                    const sorted = [...filtered.filter(k => k !== "other"), ...filtered.filter(k => k === "other")];

                    return sorted.map(key => {
                      const t = TEMPLATES[key];
                      const selected = category === key;
                      return (
                        <button key={key} onClick={() => setCategory(key)}
                          className={`p-4 rounded-2xl border text-left transition-all active:scale-95 ${selected ? "border-[#00a87a] bg-[#00a87a]/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
                          <span className={`material-symbols-outlined text-2xl mb-2 block ${selected ? "text-[#4ade80]" : "text-white/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {t.icon}
                          </span>
                          <p className={`text-xs font-black ${selected ? "text-white" : "text-white/70"}`}>{lang === "sw" ? t.sw : t.label}</p>
                        </button>
                      );
                    });
                  })()}
                </div>
                
                {category === "other" && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <label className="text-white/40 text-[10px] font-black uppercase tracking-wider block">
                      {sw ? "Taja Aina ya Biashara Yako" : "Specify Your Business Type"}
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder={sw ? "Mfano: Kibanda, Salon, Cyber Cafe" : "e.g. Kibanda, Salon, Cyber Cafe"}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-white text-sm font-bold outline-none focus:border-[#00a87a] transition-all"
                    />
                  </motion.div>
                )}

                <button onClick={() => { if (category) { loadTemplate(category); setStep(2); } }}
                  disabled={!category || (category === "other" && !customCategory.trim())}
                  className="w-full h-14 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: (category && (category !== "other" || customCategory.trim())) ? "linear-gradient(135deg,#00694c,#00a87a)" : "#1a1a1a", color: "white" }}>
                  {sw ? "Endelea" : "Continue"} →
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Products ── */}
            {step === 2 && category && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <div>
                  <p className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-1">{sw ? "Hatua 2 kati ya 3" : "Step 2 of 3"}</p>
                  <h1 className="text-2xl font-black text-white">{sw ? "Bidhaa za Awali" : "Starting Inventory"}</h1>
                  <p className="text-white/50 text-sm mt-1">
                    {templateLoaded
                      ? (sw ? "Hariri bei na hesabu kama unavyotaka." : "Edit prices & quantities to match your store.")
                      : (sw ? "Tumia kiolezo au ongeza mwenyewe." : "Use an AI template or add products manually.")}
                  </p>
                </div>

                {/* Template pill */}
                {!templateLoaded && (
                  <button onClick={() => loadTemplate(category)}
                    className="w-full p-4 rounded-2xl border border-dashed border-[#00a87a]/50 bg-[#00a87a]/5 text-[#4ade80] text-sm font-black flex items-center gap-3 hover:bg-[#00a87a]/10 transition-all">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    {sw ? `Pakia Kiolezo cha AI — ${TEMPLATES[category].sw}` : `Load AI Template — ${TEMPLATES[category].label}`}
                  </button>
                )}

                {/* Product list */}
                {products.length > 0 && (
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {products.map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                        <div className="flex gap-2 items-start">
                          <input value={p.name} onChange={e => updateProduct(i, "name", e.target.value)}
                            placeholder={sw ? "Jina la bidhaa" : "Product name"}
                            className="flex-1 bg-transparent text-white text-sm font-bold outline-none border-b border-white/10 focus:border-[#00a87a] pb-1 min-w-0" />
                          <button onClick={() => removeProduct(i)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { field: "unit_price" as const, label: sw ? "Bei (KES)" : "Price (KES)" },
                            { field: "stock_quantity" as const, label: sw ? "Hesabu" : "Stock" },
                            { field: "reorder_level" as const, label: sw ? "Kiwango cha Chini" : "Reorder" },
                          ].map(({ field, label }) => (
                            <div key={field}>
                              <p className="text-white/30 text-[9px] font-black uppercase mb-1">{label}</p>
                              <input type="number" value={p[field]} onChange={e => updateProduct(i, field, parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white text-sm font-bold outline-none border-b border-white/10 focus:border-[#00a87a] pb-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={addProduct}
                  className="w-full h-11 rounded-2xl border border-dashed border-white/20 text-white/50 text-sm font-bold hover:border-white/40 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  {sw ? "Ongeza Bidhaa" : "Add Product"}
                </button>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">{error}</div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="h-14 w-14 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <button onClick={handleFinish} disabled={products.length === 0}
                    className="flex-1 h-14 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#00694c,#00a87a)" }}>
                    {sw ? "Kamilisha Usajili" : "Complete Setup"} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: AI Loading ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-12">
                <div className="relative w-24 h-24 mx-auto">
                  <motion.div className="absolute inset-0 rounded-full border-4 border-[#00a87a]/20" />
                  <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00a87a]"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white mb-3">{sw ? "AI inasanidi duka lako..." : "AI is setting up your store..."}</h2>
                  <motion.p key={aiMsgIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[#4ade80]/80 text-sm font-medium">
                    {AI_MESSAGES[aiMsgIdx]}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Success ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 rounded-full bg-[#00a87a]/20 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[48px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </motion.div>
                <div>
                  <h1 className="text-3xl font-black text-white">{sw ? "Umefanikiwa!" : "You're all set!"}</h1>
                  <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
                    {sw
                      ? `Duka lako "${storeName}" lina bidhaa ${products.length} tayari. AI iko tayari kukusaidia!`
                      : `"${storeName}" is live with ${products.length} products. Your AI inventory engine is ready!`}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                  {[
                    { icon: "inventory_2", text: sw ? `Bidhaa ${products.length} zimeongezwa` : `${products.length} products added to inventory` },
                    { icon: "auto_awesome", text: sw ? "AI imewekwa kulingana na biashara yako" : "AI calibrated for your business type" },
                    { icon: "notifications_active", text: sw ? "Tahadhari za stoki zimeanzishwa" : "Low-stock alerts are now active" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <span className="text-white/80 text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/dashboard")}
                  className="w-full h-14 rounded-2xl font-black text-white text-sm shadow-2xl shadow-[#00694c]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ background: "linear-gradient(135deg,#00694c,#00a87a)" }}>
                  {sw ? "Fungua Dashibodi Yangu →" : "Launch My Dashboard →"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
