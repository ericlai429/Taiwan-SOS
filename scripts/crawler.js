import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('🚀 開始執行雙北與桃園地區防空避難、派出所、消防隊、活動中心、外科診所與災害範圍圈數據整理...');

const MOCK_SHELTERS = [
  {
    id: "tp-shelter-01",
    name: "台北車站地下街防空避難所",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區忠孝西路一段49號地下層",
    capacity: 25000,
    lat: 25.0478,
    lng: 121.5170,
    type: "air_raid",
    notes: "大眾運輸地下交通樞紐，具良好強固鋼筋結構與獨立通風"
  },
  {
    id: "ntp-shelter-01",
    name: "新北市政府市民廣場地下避難中心",
    city: "新北市",
    district: "板橋區",
    address: "新北市板橋區中山路一段161號地下層",
    capacity: 18000,
    lat: 25.0124,
    lng: 121.4657,
    type: "air_raid",
    notes: "板橋核心避難處，具備緊急應變中心機能"
  },
  {
    id: "ty-shelter-01",
    name: "桃園火車站地下防空避難設施",
    city: "桃園市",
    district: "桃園區",
    address: "桃園市桃園區中正路1號地下層",
    capacity: 15000,
    lat: 24.9892,
    lng: 121.3135,
    type: "air_raid",
    notes: "桃園交通樞紐，強化耐震地下鋼筋空間"
  }
];

const MOCK_MEDICAL = [
  {
    id: "med-01",
    name: "國立台灣大學醫學院附設醫院 (台大醫院)",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區中山南路7號",
    phone: "02-2312-3456",
    level: "重度級急救責任醫院",
    lat: 25.0416,
    lng: 121.5186,
    status: "24H 緊急救護運作中"
  }
];

const MOCK_SUPPLIES = [
  {
    id: "sup-01",
    name: "中正區防衛戰備物資儲糧點 (台北展覽館庫房)",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區仁愛路一段17號",
    items: ["包裝飲用水", "軍用口糧", "急救止血包", "高容量備用電池"],
    hours: "08:00 - 20:00 (發放中)",
    lat: 25.0392,
    lng: 121.5234,
    stock: "充足"
  }
];

const MOCK_HIGH_RISK = [
  {
    id: "risk-01",
    name: "重要軍事行政樞紐周邊 (高警衛區域)",
    city: "台北市",
    district: "中正區",
    risk_level: "高風險提示",
    reason: "關鍵國家設施，如逢警戒應迅速進入周邊地下避難所，切勿滯留空曠露天處",
    lat: 25.0401,
    lng: 121.5120
  }
];

const MOCK_HAZARDS = [
  {
    id: "hazard-tp-01",
    type: "utility_outage",
    typeName: "💧 停水停電區 (卡其色無水區)",
    title: "中正區變電站與水管幹拆 - 局部停水停電區",
    city: "台北市",
    district: "中正區",
    lat: 25.0430,
    lng: 121.5140,
    radiusMeters: 600,
    color: "#c2b280",
    fillColor: "#c2b280",
    fillOpacity: 0.35,
    description: "無水可用（卡其色警戒），自來水幹線破裂與供電中斷。請使用戰備水罐與預備儲水。"
  }
];

const MOCK_FACILITIES = [
  {
    id: "fac-pol-01",
    type: "police",
    typeName: "👮 警察分局 / 派出所",
    name: "臺北市政府警察局中正第一分局 (忠孝西路派出所)",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區公園路15號",
    phone: "02-2371-2101",
    lat: 25.0450,
    lng: 121.5165,
    notes: "區域民防與維安中心，提供緊急治安保護"
  },
  {
    id: "fac-fire-01",
    type: "fire",
    typeName: "🚒 消防分隊",
    name: "臺北市政府消防局第一大隊城中分隊",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區愛國東路79號",
    phone: "02-2391-2365",
    lat: 25.0378,
    lng: 121.5212,
    notes: "急救與搜救第一線，配備搜救工具與救護車"
  },
  {
    id: "fac-com-01",
    type: "community",
    typeName: "🏛️ 圖書館 / 市民活動中心",
    name: "臺北市立圖書館王貫英紀念分館與市民活動中心",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區汀州路二段265號",
    phone: "02-2367-8735",
    lat: 25.0245,
    lng: 121.5278,
    notes: "指定社區安置避難點，備有室內大空間與飲水機"
  },
  {
    id: "fac-cln-01",
    type: "local_clinic",
    typeName: "🩺 中小型醫院 / 外科診所",
    name: "中正聯合外科診所 (局部創傷縫合與急診處置)",
    city: "台北市",
    district: "中正區",
    address: "台北市中正區羅斯福路二段88號",
    phone: "02-2365-1122",
    lat: 25.0280,
    lng: 121.5240,
    notes: "專門處理外傷縫合、消毒、包紮、骨折固定 (排除大醫院排隊)"
  }
];

async function runCrawler() {
  try {
    console.log('📡 正在整合避難處所、派出所、消防隊、活動中心與外科診所數據...');
    fs.writeFileSync(path.join(DATA_DIR, 'shelters.json'), JSON.stringify(MOCK_SHELTERS, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'medical.json'), JSON.stringify(MOCK_MEDICAL, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'supplies.json'), JSON.stringify(MOCK_SUPPLIES, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'high_risk.json'), JSON.stringify(MOCK_HIGH_RISK, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'hazard_zones.json'), JSON.stringify(MOCK_HAZARDS, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'facilities.json'), JSON.stringify(MOCK_FACILITIES, null, 2), 'utf-8');
    console.log('✅ 所有數據（含派出所、消防隊與外科診所）已順利產出！');
  } catch (err) {
    console.error('❌ 爬蟲更新過程發生錯誤:', err);
  }
}

runCrawler();
