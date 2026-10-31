import { db, pool } from "./db.js";
import { categories, products } from "../schema/schema.js";
import { inArray } from "drizzle-orm";

const seedProducts = [
  {
    "id": "1",
    "name": "Wireless Over-Ear Headphones",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    "price": "100.00",
    "oldPrice": "150.00",
    "isActive": true
  },
  {
    "id": "2",
    "name": "Bluetooth Noise-Cancelling Headphones",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80",
    "price": "117.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "3",
    "name": "Portable Bluetooth Speaker",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
    "price": "134.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "4",
    "name": "Smart LED Desk Lamp",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1652198050957-fd1c6aab021f?auto=format&fit=crop&w=600&q=80",
    "price": "151.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "5",
    "name": "Wireless Mechanical Keyboard",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80",
    "price": "168.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "6",
    "name": "Precision Wireless Mouse",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
    "price": "185.00",
    "oldPrice": "235.00",
    "isActive": true
  },
  {
    "id": "7",
    "name": "4K Ultra HD Monitor",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1551645120-d70bfe84c826?auto=format&fit=crop&w=600&q=80",
    "price": "202.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "8",
    "name": "Portable SSD Drive",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1721333084639-0f64b0583875?auto=format&fit=crop&w=600&q=80",
    "price": "219.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "9",
    "name": "USB-C Multiport Hub",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1616578273461-3a99ce422de6?auto=format&fit=crop&w=600&q=80",
    "price": "236.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "10",
    "name": "Compact Power Bank",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=600&q=80",
    "price": "253.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "11",
    "name": "Fast Wireless Charging Pad",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1633381638729-27f730955c23?auto=format&fit=crop&w=600&q=80",
    "price": "270.00",
    "oldPrice": "320.00",
    "isActive": true
  },
  {
    "id": "12",
    "name": "Smart Fitness Watch",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1660844817855-3ecc7ef21f12?auto=format&fit=crop&w=600&q=80",
    "price": "287.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "13",
    "name": "Digital Camera",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
    "price": "304.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "14",
    "name": "Waterproof Action Camera",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1484506399805-c273b8e91dce?auto=format&fit=crop&w=600&q=80",
    "price": "321.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "15",
    "name": "Voice-Control Smart Speaker",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1519558260268-cde7e03a0152?auto=format&fit=crop&w=600&q=80",
    "price": "338.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "16",
    "name": "Noise-Isolating Earbuds",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80",
    "price": "355.00",
    "oldPrice": "405.00",
    "isActive": true
  },
  {
    "id": "17",
    "name": "Universal Laptop Stand",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1634947096506-6d9f114cf64e?auto=format&fit=crop&w=600&q=80",
    "price": "372.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "18",
    "name": "Gaming Controller",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80",
    "price": "389.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "19",
    "name": "Adjustable Phone Tripod",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1576299090369-9067e4adca28?auto=format&fit=crop&w=600&q=80",
    "price": "406.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "20",
    "name": "Rechargeable Reading Light",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1766411503489-c6fe7b008bd6?auto=format&fit=crop&w=600&q=80",
    "price": "423.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "21",
    "name": "Everyday Running Sneakers",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1597892657493-6847b9640bac?auto=format&fit=crop&w=600&q=80",
    "price": "175.00",
    "oldPrice": "225.00",
    "isActive": true
  },
  {
    "id": "22",
    "name": "Classic Canvas Trainers",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1720019315435-b10b01792d9f?auto=format&fit=crop&w=600&q=80",
    "price": "192.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "23",
    "name": "Lightweight Walking Shoes",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1559506026-181ed433f0b0?auto=format&fit=crop&w=600&q=80",
    "price": "209.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "24",
    "name": "Leather Ankle Boots",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80",
    "price": "226.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "25",
    "name": "Casual Cotton T-Shirt",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80",
    "price": "243.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "26",
    "name": "Classic Oxford Shirt",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1791631064348-0337580f80d1?auto=format&fit=crop&w=600&q=80",
    "price": "260.00",
    "oldPrice": "310.00",
    "isActive": true
  },
  {
    "id": "27",
    "name": "Relaxed Fit Denim Jeans",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1714143164072-7646ef5cb24d?auto=format&fit=crop&w=600&q=80",
    "price": "277.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "28",
    "name": "Tailored Chino Trousers",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1619470148547-0adbfc64b595?auto=format&fit=crop&w=600&q=80",
    "price": "294.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "29",
    "name": "Lightweight Hooded Jacket",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=600&q=80",
    "price": "311.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "30",
    "name": "Everyday Knit Sweater",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?auto=format&fit=crop&w=600&q=80",
    "price": "328.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "31",
    "name": "Zip-Up Track Jacket",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1768983953826-231e8ef0b6dc?auto=format&fit=crop&w=600&q=80",
    "price": "345.00",
    "oldPrice": "395.00",
    "isActive": true
  },
  {
    "id": "32",
    "name": "Casual Summer Dress",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
    "price": "362.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "33",
    "name": "Linen Button-Down Shirt",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1740711152088-88a009e877bb?auto=format&fit=crop&w=600&q=80",
    "price": "379.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "34",
    "name": "Essential Polo Shirt",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?auto=format&fit=crop&w=600&q=80",
    "price": "396.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "35",
    "name": "Comfort Fit Joggers",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1779675787172-fcac54b36bab?auto=format&fit=crop&w=600&q=80",
    "price": "413.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "36",
    "name": "Quilted Puffer Vest",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1636529109797-0749811c4916?auto=format&fit=crop&w=600&q=80",
    "price": "430.00",
    "oldPrice": "480.00",
    "isActive": true
  },
  {
    "id": "37",
    "name": "Classic Denim Jacket",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=600&q=80",
    "price": "447.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "38",
    "name": "Leather Everyday Belt",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1664286074176-5206ee5dc878?auto=format&fit=crop&w=600&q=80",
    "price": "464.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "39",
    "name": "Soft Cotton Hoodie",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&w=600&q=80",
    "price": "481.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "40",
    "name": "Water-Resistant Raincoat",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1567955465154-078c60ff5c9e?auto=format&fit=crop&w=600&q=80",
    "price": "498.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "41",
    "name": "Classic Stainless Steel Watch",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1695345272166-4efd76dd7a21?auto=format&fit=crop&w=600&q=80",
    "price": "250.00",
    "oldPrice": "300.00",
    "isActive": true
  },
  {
    "id": "42",
    "name": "Minimalist Leather Watch",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80",
    "price": "267.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "43",
    "name": "Polarized Sunglasses",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80",
    "price": "284.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "44",
    "name": "Round Frame Sunglasses",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1587310311582-aa7610e90826?auto=format&fit=crop&w=600&q=80",
    "price": "301.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "45",
    "name": "Everyday Leather Wallet",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    "price": "318.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "46",
    "name": "Compact Card Holder",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1703355685823-53577f97f54e?auto=format&fit=crop&w=600&q=80",
    "price": "335.00",
    "oldPrice": "385.00",
    "isActive": true
  },
  {
    "id": "47",
    "name": "Insulated Travel Mug",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1642698043660-a3827ca09337?auto=format&fit=crop&w=600&q=80",
    "price": "352.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "48",
    "name": "Stainless Steel Water Bottle",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    "price": "369.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "49",
    "name": "Soft Knit Beanie",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1565058528605-670489ab6f6c?auto=format&fit=crop&w=600&q=80",
    "price": "386.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "50",
    "name": "Lightweight Everyday Scarf",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1623832101940-647285e32a58?auto=format&fit=crop&w=600&q=80",
    "price": "403.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "51",
    "name": "Classic Baseball Cap",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1691256676359-20e5c6d4bc92?auto=format&fit=crop&w=600&q=80",
    "price": "420.00",
    "oldPrice": "470.00",
    "isActive": true
  },
  {
    "id": "52",
    "name": "Leather Key Organizer",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1675582090584-4ae9400f7326?auto=format&fit=crop&w=600&q=80",
    "price": "437.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "53",
    "name": "Travel Passport Holder",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1549937915-3dd443a3583f?auto=format&fit=crop&w=600&q=80",
    "price": "454.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "54",
    "name": "Compact Umbrella",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1604560353366-28e44ad06afe?auto=format&fit=crop&w=600&q=80",
    "price": "471.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "55",
    "name": "Woven Everyday Bracelet",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1708221235482-a6e2a807198f?auto=format&fit=crop&w=600&q=80",
    "price": "488.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "56",
    "name": "Simple Pendant Necklace",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1705326452390-3ecf6070595f?auto=format&fit=crop&w=600&q=80",
    "price": "505.00",
    "oldPrice": "555.00",
    "isActive": true
  },
  {
    "id": "57",
    "name": "Classic Hoop Earrings",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80",
    "price": "522.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "58",
    "name": "Polarized Sports Sunglasses",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1708799366365-a24608103bed?auto=format&fit=crop&w=600&q=80",
    "price": "539.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "59",
    "name": "Reusable Shopping Tote",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?auto=format&fit=crop&w=600&q=80",
    "price": "556.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "60",
    "name": "Travel Toiletry Organizer",
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1764909262009-3dcd5691185c?auto=format&fit=crop&w=600&q=80",
    "price": "573.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "61",
    "name": "Everyday Commuter Backpack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1551974222-1d49f576a2a4?auto=format&fit=crop&w=600&q=80",
    "price": "325.00",
    "oldPrice": "375.00",
    "isActive": true
  },
  {
    "id": "62",
    "name": "Compact Laptop Backpack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1594299447935-e5b840f54b9b?auto=format&fit=crop&w=600&q=80",
    "price": "342.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "63",
    "name": "Lightweight Travel Backpack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?auto=format&fit=crop&w=600&q=80",
    "price": "359.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "64",
    "name": "Water-Resistant Daypack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1622260614153-03223fb72052?auto=format&fit=crop&w=600&q=80",
    "price": "376.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "65",
    "name": "Canvas Weekend Duffel",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1595539360053-aeba30eb4424?auto=format&fit=crop&w=600&q=80",
    "price": "393.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "66",
    "name": "Compact Gym Duffel",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1579556397147-48e5ffa85b84?auto=format&fit=crop&w=600&q=80",
    "price": "410.00",
    "oldPrice": "460.00",
    "isActive": true
  },
  {
    "id": "67",
    "name": "Structured Work Tote",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    "price": "427.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "68",
    "name": "Canvas Everyday Tote",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1663573690125-d326a87a2535?auto=format&fit=crop&w=600&q=80",
    "price": "444.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "69",
    "name": "Crossbody Travel Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1620786514684-ff35b5aae55e?auto=format&fit=crop&w=600&q=80",
    "price": "461.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "70",
    "name": "Compact Camera Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1657603719375-8ffdacaac790?auto=format&fit=crop&w=600&q=80",
    "price": "478.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "71",
    "name": "Classic Messenger Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=600&q=80",
    "price": "495.00",
    "oldPrice": "545.00",
    "isActive": true
  },
  {
    "id": "72",
    "name": "Padded Laptop Sleeve",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1689757855413-9e366c2011f1?auto=format&fit=crop&w=600&q=80",
    "price": "512.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "73",
    "name": "Expandable Carry-On Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1714235058817-af16a662fe1d?auto=format&fit=crop&w=600&q=80",
    "price": "529.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "74",
    "name": "Rolling Cabin Suitcase",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1670888664952-efff442ec0d2?auto=format&fit=crop&w=600&q=80",
    "price": "546.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "75",
    "name": "Foldable Travel Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1631728370215-9440df2e29e3?auto=format&fit=crop&w=600&q=80",
    "price": "563.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "76",
    "name": "Compact Waist Pack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1565151448704-33d96c51fff0?auto=format&fit=crop&w=600&q=80",
    "price": "580.00",
    "oldPrice": "630.00",
    "isActive": true
  },
  {
    "id": "77",
    "name": "Leather Shoulder Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=600&q=80",
    "price": "597.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "78",
    "name": "Everyday Sling Backpack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1597671053855-1132c40cc1ce?auto=format&fit=crop&w=600&q=80",
    "price": "614.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "79",
    "name": "Insulated Lunch Bag",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1571780752627-1052116323d3?auto=format&fit=crop&w=600&q=80",
    "price": "631.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "80",
    "name": "Organized Travel Backpack",
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=600&q=80",
    "price": "648.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "81",
    "name": "Soft Cotton Cushion Cover",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?auto=format&fit=crop&w=600&q=80",
    "price": "400.00",
    "oldPrice": "450.00",
    "isActive": true
  },
  {
    "id": "82",
    "name": "Textured Knit Throw Blanket",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1674475760738-8c7af859f821?auto=format&fit=crop&w=600&q=80",
    "price": "417.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "83",
    "name": "Ceramic Table Vase",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80",
    "price": "434.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "84",
    "name": "Minimalist Wall Clock",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80",
    "price": "451.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "85",
    "name": "Warm Glow Table Lamp",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1621177555630-b861919c864f?auto=format&fit=crop&w=600&q=80",
    "price": "468.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "86",
    "name": "Scented Soy Candle",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1612293905607-b003de9e54fb?auto=format&fit=crop&w=600&q=80",
    "price": "485.00",
    "oldPrice": "535.00",
    "isActive": true
  },
  {
    "id": "87",
    "name": "Handwoven Storage Basket",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1586802005224-03286636cbca?auto=format&fit=crop&w=600&q=80",
    "price": "502.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "88",
    "name": "Stackable Ceramic Mug Set",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1590422749897-47036da0b0ff?auto=format&fit=crop&w=600&q=80",
    "price": "519.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "89",
    "name": "Cotton Bath Towel Set",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1616663717839-2fea42e1a1f6?auto=format&fit=crop&w=600&q=80",
    "price": "536.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "90",
    "name": "Soft Woven Area Rug",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1745905308908-25f35bacd146?auto=format&fit=crop&w=600&q=80",
    "price": "553.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "91",
    "name": "Wooden Serving Tray",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1524084848619-1161d3c8501a?auto=format&fit=crop&w=600&q=80",
    "price": "570.00",
    "oldPrice": "620.00",
    "isActive": true
  },
  {
    "id": "92",
    "name": "Reusable Glass Food Containers",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1569420077790-afb136b3bb8c?auto=format&fit=crop&w=600&q=80",
    "price": "587.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "93",
    "name": "Stainless Steel Cookware Set",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1584990347193-6bebebfeaeee?auto=format&fit=crop&w=600&q=80",
    "price": "604.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "94",
    "name": "Bamboo Chopping Board",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1589071866921-75b6bd683d15?auto=format&fit=crop&w=600&q=80",
    "price": "621.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "95",
    "name": "Compact Pour-Over Coffee Maker",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1565452344518-47faca79dc69?auto=format&fit=crop&w=600&q=80",
    "price": "638.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "96",
    "name": "Double-Wall Travel Tumbler",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1589905490712-878ce54e1349?auto=format&fit=crop&w=600&q=80",
    "price": "655.00",
    "oldPrice": "705.00",
    "isActive": true
  },
  {
    "id": "97",
    "name": "Adjustable Reading Lamp",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1621447980929-6638614633c8?auto=format&fit=crop&w=600&q=80",
    "price": "672.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "98",
    "name": "Decorative Photo Frame",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?auto=format&fit=crop&w=600&q=80",
    "price": "689.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "99",
    "name": "Linen Table Runner",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1705290304352-4beef0b626b3?auto=format&fit=crop&w=600&q=80",
    "price": "706.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "100",
    "name": "Stoneware Dinner Plate Set",
    "category": "Home & Living",
    "image": "https://images.unsplash.com/photo-1571987530791-58e3e7744d99?auto=format&fit=crop&w=600&q=80",
    "price": "723.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "101",
    "name": "The Midnight Library",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
    "price": "475.00",
    "oldPrice": "525.00",
    "isActive": true
  },
  {
    "id": "102",
    "name": "Atomic Habits",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1598301257942-e6bde1d2149b?auto=format&fit=crop&w=600&q=80",
    "price": "492.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "103",
    "name": "The Psychology of Money",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=600&q=80",
    "price": "509.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "104",
    "name": "Educated: A Memoir",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1660322813920-810aa6e447d4?auto=format&fit=crop&w=600&q=80",
    "price": "526.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "105",
    "name": "The Creative Act",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1537861295351-76bb831ece99?auto=format&fit=crop&w=600&q=80",
    "price": "543.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "106",
    "name": "The Seven Husbands of Evelyn Hugo",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1765988789679-2cef7562eef2?auto=format&fit=crop&w=600&q=80",
    "price": "560.00",
    "oldPrice": "610.00",
    "isActive": true
  },
  {
    "id": "107",
    "name": "Project Hail Mary",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1607539692943-80772d90613d?auto=format&fit=crop&w=600&q=80",
    "price": "577.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "108",
    "name": "The Art of Travel",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=600&q=80",
    "price": "594.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "109",
    "name": "The Little Prince",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1643439766762-b3731e689f83?auto=format&fit=crop&w=600&q=80",
    "price": "611.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "110",
    "name": "The Complete Baking Cookbook",
    "category": "Books",
    "image": "https://images.unsplash.com/photo-1532499016263-f2c3e89de9cd?auto=format&fit=crop&w=600&q=80",
    "price": "628.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "121",
    "name": "Hydrating Facial Cleanser",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1599847987657-881f11b92a75?auto=format&fit=crop&w=600&q=80",
    "price": "550.00",
    "oldPrice": "600.00",
    "isActive": true
  },
  {
    "id": "122",
    "name": "Daily Moisturizing Cream",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?auto=format&fit=crop&w=600&q=80",
    "price": "567.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "123",
    "name": "Vitamin C Face Serum",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1723951174326-2a97221d3b7f?auto=format&fit=crop&w=600&q=80",
    "price": "584.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "124",
    "name": "Broad Spectrum Sunscreen",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1603401712778-ab0575182f12?auto=format&fit=crop&w=600&q=80",
    "price": "601.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "125",
    "name": "Nourishing Hair Shampoo",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?auto=format&fit=crop&w=600&q=80",
    "price": "618.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "126",
    "name": "Moisture Repair Conditioner",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1682684096929-f1b5e69eda17?auto=format&fit=crop&w=600&q=80",
    "price": "635.00",
    "oldPrice": "685.00",
    "isActive": true
  },
  {
    "id": "127",
    "name": "Botanical Body Lotion",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    "price": "652.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "128",
    "name": "Gentle Facial Toner",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1670201202833-b0932731628f?auto=format&fit=crop&w=600&q=80",
    "price": "669.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "129",
    "name": "Reusable Makeup Brush Set",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1678695692040-e9a39502c357?auto=format&fit=crop&w=600&q=80",
    "price": "686.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "130",
    "name": "Aromatherapy Essential Oil Set",
    "category": "Beauty & Personal Care",
    "image": "https://images.unsplash.com/photo-1625480496848-f7805d95d37b?auto=format&fit=crop&w=600&q=80",
    "price": "703.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "141",
    "name": "Non-Slip Yoga Mat",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1637157216470-d92cd2edb2e8?auto=format&fit=crop&w=600&q=80",
    "price": "625.00",
    "oldPrice": "675.00",
    "isActive": true
  },
  {
    "id": "142",
    "name": "Adjustable Dumbbell Set",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1703668984128-b506579acdd2?auto=format&fit=crop&w=600&q=80",
    "price": "642.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "143",
    "name": "Insulated Hiking Bottle",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1544003484-3cd181d17917?auto=format&fit=crop&w=600&q=80",
    "price": "659.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "144",
    "name": "Lightweight Camping Tent",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
    "price": "676.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "145",
    "name": "Trail Running Hydration Pack",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1660229471028-1c51cf733a17?auto=format&fit=crop&w=600&q=80",
    "price": "693.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "146",
    "name": "Indoor Cycling Helmet",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1628440167042-197d8eb88929?auto=format&fit=crop&w=600&q=80",
    "price": "710.00",
    "oldPrice": "760.00",
    "isActive": true
  },
  {
    "id": "147",
    "name": "Resistance Band Set",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
    "price": "727.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "148",
    "name": "Compact Camping Lantern",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1569474361233-0bdf04817133?auto=format&fit=crop&w=600&q=80",
    "price": "744.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "149",
    "name": "Outdoor Pickleball Set",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1756477558468-b3e485757470?auto=format&fit=crop&w=600&q=80",
    "price": "761.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "150",
    "name": "Waterproof Hiking Backpack",
    "category": "Sports & Outdoors",
    "image": "https://images.unsplash.com/photo-1476979735039-2fdea9e9e407?auto=format&fit=crop&w=600&q=80",
    "price": "778.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "161",
    "name": "Classic Wooden Building Blocks",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1730382625230-3756013c515c?auto=format&fit=crop&w=600&q=80",
    "price": "700.00",
    "oldPrice": "750.00",
    "isActive": true
  },
  {
    "id": "162",
    "name": "Family Strategy Board Game",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1629760946220-5693ee4c46ac?auto=format&fit=crop&w=600&q=80",
    "price": "717.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "163",
    "name": "Jigsaw Puzzle: World Wonders",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1588591795084-1770cb3be374?auto=format&fit=crop&w=600&q=80",
    "price": "734.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "164",
    "name": "Creative Modeling Clay Set",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1781389005305-90f2f3f63bfc?auto=format&fit=crop&w=600&q=80",
    "price": "751.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "165",
    "name": "Remote Control Race Car",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1758964087156-0eac97044f84?auto=format&fit=crop&w=600&q=80",
    "price": "768.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "166",
    "name": "Beginner Science Experiment Kit",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1633828763399-e29f1cd3f4c1?auto=format&fit=crop&w=600&q=80",
    "price": "785.00",
    "oldPrice": "835.00",
    "isActive": true
  },
  {
    "id": "167",
    "name": "Plush Animal Toy",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1591926828257-2eefb8aa42fa?auto=format&fit=crop&w=600&q=80",
    "price": "802.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "168",
    "name": "Magnetic Tile Building Set",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1580600699997-b0c26c29507d?auto=format&fit=crop&w=600&q=80",
    "price": "819.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "169",
    "name": "Kids Art and Craft Box",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1560421683-6856ea585c78?auto=format&fit=crop&w=600&q=80",
    "price": "836.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "170",
    "name": "Classic Playing Card Set",
    "category": "Toys & Games",
    "image": "https://images.unsplash.com/photo-1636583133884-fbefc7ac3fb3?auto=format&fit=crop&w=600&q=80",
    "price": "853.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "181",
    "name": "Adjustable Dog Walking Harness",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1580459476964-822a39c5697e?auto=format&fit=crop&w=600&q=80",
    "price": "775.00",
    "oldPrice": "825.00",
    "isActive": true
  },
  {
    "id": "182",
    "name": "Comfort Pet Bed",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1787295145688-ce23470cefdd?auto=format&fit=crop&w=600&q=80",
    "price": "792.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "183",
    "name": "Stainless Steel Pet Bowl Set",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1677973591478-41b5b97d7738?auto=format&fit=crop&w=600&q=80",
    "price": "809.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "184",
    "name": "Interactive Cat Toy",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1668883011396-24786aa075e3?auto=format&fit=crop&w=600&q=80",
    "price": "826.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "185",
    "name": "Durable Dog Chew Toy",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1722257401181-a04cc4df36f8?auto=format&fit=crop&w=600&q=80",
    "price": "843.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "186",
    "name": "Portable Pet Water Bottle",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1662279059788-9084be005a95?auto=format&fit=crop&w=600&q=80",
    "price": "860.00",
    "oldPrice": "910.00",
    "isActive": true
  },
  {
    "id": "187",
    "name": "Soft Pet Grooming Brush",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1675430426271-d74b542f21e4?auto=format&fit=crop&w=600&q=80",
    "price": "877.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "188",
    "name": "Foldable Pet Travel Crate",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1780598346497-3090833b7e4c?auto=format&fit=crop&w=600&q=80",
    "price": "894.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "189",
    "name": "Cat Scratching Post",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=600&q=80",
    "price": "911.00",
    "oldPrice": null,
    "isActive": true
  },
  {
    "id": "190",
    "name": "Reflective Pet Collar",
    "category": "Pet Supplies",
    "image": "https://images.unsplash.com/photo-1605639496822-eddf63ad6c8f?auto=format&fit=crop&w=600&q=80",
    "price": "928.00",
    "oldPrice": null,
    "isActive": true
  }
];

async function main() {
  try {
    const categoryNames = [
      ...new Set(
        seedProducts.map((product) => product.category.trim() || "Uncategorized"),
      ),
    ];
    await db
      .insert(categories)
      .values(categoryNames.map((name) => ({ name })))
      .onConflictDoNothing();

    const categoryRows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(inArray(categories.name, categoryNames));
    const categoryIds = new Map(categoryRows.map((category) => [category.name, category.id]));

    const seedIds = seedProducts.map((product) => product.id);
    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, seedIds));
    const existingIds = new Set(existingProducts.map((product) => product.id));
    const productsToInsert = seedProducts
      .filter((product) => !existingIds.has(product.id))
      .map(({ category, ...product }) => {
        const categoryName = category.trim() || "Uncategorized";
        const categoryId = categoryIds.get(categoryName);
        if (!categoryId) throw new Error(`Missing category seed: ${categoryName}`);
        return { ...product, categoryId, stockQuantity: 0 };
      });

    if (productsToInsert.length === 0) {
      console.log("All seed products already exist; nothing to insert.");
      return;
    }

    // Keep this conflict guard in case another seed process inserts concurrently.
    const insertedProducts = await db
      .insert(products)
      .values(productsToInsert)
      .onConflictDoNothing()
      .returning({ id: products.id });

    console.log("Inserted " + insertedProducts.length + " missing products.");
  } catch (error) {
    console.error("Failed to seed products:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
