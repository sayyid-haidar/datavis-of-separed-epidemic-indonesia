import Papa from 'papaparse';

// ==================== UNIFIED DATA TYPES ====================

export interface UnifiedData {
  metadata: {
    title: string;
    description: string;
    sources: string[];
    lastUpdated: string;
    version: string;
  };
  regions: {
    jakarta: RegionInfo;
    jabar: RegionInfo;
    jatim: RegionInfo;
  };
  diseases: DiseaseInfo[];
  data: {
    jakarta: Record<string, JakartaYearData>;
    cirebon: CirebonData;
    bogor: BogorData;
    jatim: JatimData;
  };
  analytics: AnalyticsData;
}

export interface RegionInfo {
  name: string;
  type: string;
  kode: string;
  districts?: { id: string; name: string; type: string }[];
}

export interface DiseaseInfo {
  id: string;
  name: string;
  category: string;
  preventable: boolean;
}

export interface DiseaseCount {
  laki: number;
  perempuan: number;
  total: number;
}

export interface JakartaYearData {
  periode: string;
  source: string;
  isEstimated?: boolean;
  cases: {
    district: string;
    diseases: Record<string, DiseaseCount>;
  }[];
  summary: Record<string, DiseaseCount>;
}

export interface CirebonData {
  description: string;
  diseaseType: string;
  subdistricts: { id: string; name: string }[];
  yearlyData: Record<string, Record<string, number>>;
  summary: {
    totalAllYears: number;
    peakYear: number;
    peakCount: number;
    hotspot: string;
  };
}

export interface BogorData {
  description: string;
  diseaseType: string;
  subdistricts: { id: string; name: string }[];
  yearlyData: Record<string, Record<string, number | boolean>>;
  summary: {
    totalAllYears: number;
    peakYear: number;
    peakCount: number;
    hotspot: string;
  };
}

export interface JatimDiseaseCount {
  igd: number;
  rawat_inap: number;
  total: number;
}

export interface JatimYearData {
  periode: string;
  isPartialYear?: boolean;
  diseases: Record<string, JatimDiseaseCount>;
  summary: {
    totalCases: number;
    topDiseases: string[];
    note?: string;
    yearOverYearChange?: Record<string, { change: number; percent: number }>;
  };
}

export interface JatimInsight {
  description: string;
  cases2024?: number;
  cases2025?: number;
  peak2022?: number;
  current2024?: number;
}

export interface JatimData {
  description: string;
  source: string;
  diseaseTypes: { id: string; name: string }[];
  yearlyData: Record<string, JatimYearData>;
  insights: Record<string, JatimInsight>;
  summary: {
    totalAllYears: number;
    peakYear: number;
    peakCount: number;
    mainDiseases: string[];
  };
}

export interface AnalyticsData {
  trends: Record<string, {
    type: string;
    description: string;
    yearOverYearChange?: { from: number; to: number; change: number; percentChange: number }[];
    peakValue?: number;
  }>;
  hotspots: { region: string; disease: string; year: number; cases: number }[];
  recommendations: string[];
}

// ==================== DATA FETCHING ====================

let cachedUnifiedData: UnifiedData | null = null;

export async function fetchUnifiedData(): Promise<UnifiedData> {
  if (cachedUnifiedData) return cachedUnifiedData;
  
  const response = await fetch(`${import.meta.env.BASE_URL}data/unified-data.json`);
  cachedUnifiedData = await response.json();
  return cachedUnifiedData!;
}

// ==================== CHART DATA TRANSFORMERS ====================

// Jakarta data by district for bar chart
export function getJakartaDistrictData(unifiedData: UnifiedData, year: string, disease: string) {
  const yearData = unifiedData.data.jakarta[year];
  if (!yearData) return [];
  
  return yearData.cases.map(districtData => {
    const diseaseData = districtData.diseases[disease] || { laki: 0, perempuan: 0, total: 0 };
    const districtInfo = unifiedData.regions.jakarta.districts?.find(d => d.id === districtData.district);
    
    return {
      name: districtInfo?.name || districtData.district,
      id: districtData.district,
      laki: diseaseData.laki,
      perempuan: diseaseData.perempuan,
      total: diseaseData.total
    };
  });
}

// Jakarta year-over-year comparison
export function getJakartaYearComparison(unifiedData: UnifiedData, disease: string) {
  const years = Object.keys(unifiedData.data.jakarta).sort();
  return years.map(year => {
    const yearData = unifiedData.data.jakarta[year];
    const summary = yearData.summary[disease] || { total: 0, laki: 0, perempuan: 0 };
    return {
      year,
      total: summary.total,
      laki: summary.laki,
      perempuan: summary.perempuan,
      isEstimated: yearData.isEstimated || false
    };
  });
}

// Cirebon yearly trend
export function getCirebonYearlyTrend(unifiedData: UnifiedData) {
  const yearlyData = unifiedData.data.cirebon.yearlyData;
  return Object.entries(yearlyData)
    .map(([year, data]) => ({
      year,
      total: data.total as number
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

// Cirebon by subdistrict
export function getCirebonBySubdistrict(unifiedData: UnifiedData) {
  const yearlyData = unifiedData.data.cirebon.yearlyData;
  const subdistricts = unifiedData.data.cirebon.subdistricts;
  
  return subdistricts.map(sub => {
    let total = 0;
    Object.values(yearlyData).forEach(yearData => {
      total += (yearData[sub.id] as number) || 0;
    });
    return {
      name: sub.name,
      id: sub.id,
      total
    };
  }).sort((a, b) => b.total - a.total);
}

// Bogor yearly trend
export function getBogorYearlyTrend(unifiedData: UnifiedData) {
  const yearlyData = unifiedData.data.bogor.yearlyData;
  return Object.entries(yearlyData)
    .map(([year, data]) => ({
      year,
      total: (data.total as number) || 0,
      isEstimated: data.isEstimated || false
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

// Bogor by subdistrict (non-zero only)
export function getBogorBySubdistrict(unifiedData: UnifiedData) {
  const yearlyData = unifiedData.data.bogor.yearlyData;
  const subdistricts = unifiedData.data.bogor.subdistricts;
  
  return subdistricts.map(sub => {
    let total = 0;
    Object.values(yearlyData).forEach(yearData => {
      total += (yearData[sub.id] as number) || 0;
    });
    return {
      name: sub.name,
      id: sub.id,
      total
    };
  }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
}

// Jawa Timur disease comparison
export function getJatimDiseaseComparison(unifiedData: UnifiedData) {
  const years = Object.keys(unifiedData.data.jatim.yearlyData).sort();
  const diseases = ['diare-akut', 'dengue', 'pneumonia', 'tifoid'];
  
  return years.map(year => {
    const yearData = unifiedData.data.jatim.yearlyData[year];
    const result: Record<string, number | string | boolean> = { year, isPartialYear: yearData.isPartialYear || false };
    
    diseases.forEach(disease => {
      result[disease] = yearData.diseases[disease]?.total || 0;
    });
    
    return result;
  });
}

// Summary statistics
export function getSummaryStats(unifiedData: UnifiedData) {
  const jakarta2023 = unifiedData.data.jakarta['2023'];
  const jakarta2022 = unifiedData.data.jakarta['2022'];
  
  const difteri2023 = jakarta2023?.summary['difteri']?.total || 0;
  const difteri2022 = jakarta2022?.summary['difteri']?.total || 0;
  const difteriChange = difteri2023 - difteri2022;
  const difteriChangePercent = difteri2022 > 0 ? ((difteriChange / difteri2022) * 100).toFixed(1) : '0';
  
  return {
    jakartaDifteri2023: difteri2023,
    jakartaDifteri2022: difteri2022,
    difteriChange,
    difteriChangePercent,
    cirebonTotal: unifiedData.data.cirebon.summary.totalAllYears,
    cirebonPeak: unifiedData.data.cirebon.summary.peakCount,
    cirebonPeakYear: unifiedData.data.cirebon.summary.peakYear,
    bogorTotal: unifiedData.data.bogor.summary.totalAllYears,
    hotspots: unifiedData.analytics.hotspots,
    recommendations: unifiedData.analytics.recommendations
  };
}

// ==================== LEGACY TYPES (for backward compatibility) ====================

export interface JakartaDataItem {
  periode_data: string;
  wilayah?: string;
  kota_atau_kabupaten?: string;
  jenis_kelamin: string;
  jenis_kasus?: string;
  jumlah?: string;
  jumlah_difteri?: string;
  jumlah_kipi_serius?: string;
  jumlah_hepatitis_a?: string;
  jumlah_mers_cov?: string;
}

export interface JakartaResponse {
  data: JakartaDataItem[];
  total_file: number;
  message: string;
}

export interface CirebonDataItem {
  id: string;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  bps_kode_kecamatan: string;
  bps_nama_kecamatan: string;
  kemendagri_kode_kecamatan: string;
  kemendagri_nama_kecamatan: string;
  jumlah_kasus: string;
  satuan: string;
  tahun: string;
}

export interface BogorDataItem {
  id: string;
  kode_provinsi: string;
  nama_provinsi: string;
  bps_kode_kabupaten_kota: string;
  bps_nama_kabupaten_kota: string;
  bps_kode_kecamatan: string;
  bps_nama_kecamatan: string;
  kemendagri_kode_kecamatan: string;
  kemendagri_nama_kecamatan: string;
  satuan: string;
  jumlah_wabah_lainya: string;
  tahun: string;
}

export interface JawaTimurDataItem {
  id: string;
  id_index: string;
  kode_provinsi: string;
  nama_provinsi: string;
  periode_update: string;
  penyakit: string;
  kategori: string;
  jumlah: string;
  satuan: string;
  tahun: string;
}

// ==================== LEGACY FUNCTIONS (for backward compatibility) ====================

export async function fetchJakartaData(year: '2022' | '2023'): Promise<JakartaResponse> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/jakarta-${year}.json`);
  return response.json();
}

export async function fetchCSVData<T>(filename: string): Promise<T[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}`);
  const text = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
}

export function transformJakartaDataByRegion(data: JakartaDataItem[], diseaseType: string) {
  const regionMap = new Map<string, { laki: number; perempuan: number }>();
  
  data.forEach(item => {
    const region = item.wilayah || item.kota_atau_kabupaten || 'Unknown';
    const kasusMatch = item.jenis_kasus?.toLowerCase().includes(diseaseType.toLowerCase());
    
    if (kasusMatch || diseaseType === 'difteri') {
      const jumlah = parseInt(item.jumlah || item.jumlah_difteri || '0', 10);
      
      if (!regionMap.has(region)) {
        regionMap.set(region, { laki: 0, perempuan: 0 });
      }
      
      const current = regionMap.get(region)!;
      if (item.jenis_kelamin.toLowerCase().includes('laki')) {
        current.laki += jumlah;
      } else {
        current.perempuan += jumlah;
      }
    }
  });
  
  return Array.from(regionMap.entries()).map(([name, values]) => ({
    name: name.replace('KOTA ADM. ', '').replace('KAB. ADM. ', ''),
    laki: values.laki,
    perempuan: values.perempuan,
    total: values.laki + values.perempuan,
  }));
}

export function transformCirebonByYear(data: CirebonDataItem[]) {
  const yearMap = new Map<string, number>();
  
  data.forEach(item => {
    const year = item.tahun;
    const jumlah = parseInt(item.jumlah_kasus, 10);
    
    if (!yearMap.has(year)) {
      yearMap.set(year, 0);
    }
    yearMap.set(year, yearMap.get(year)! + jumlah);
  });
  
  return Array.from(yearMap.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

export function transformBogorByYear(data: BogorDataItem[]) {
  const yearMap = new Map<string, number>();
  
  data.forEach(item => {
    const year = item.tahun;
    const jumlah = parseInt(item.jumlah_wabah_lainya, 10);
    
    if (!yearMap.has(year)) {
      yearMap.set(year, 0);
    }
    yearMap.set(year, yearMap.get(year)! + jumlah);
  });
  
  return Array.from(yearMap.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

export function transformJawaTimurByMonth(data: JawaTimurDataItem[], diseaseName: string) {
  const monthMap = new Map<string, number>();
  
  data.forEach(item => {
    if (item.penyakit.toLowerCase().includes(diseaseName.toLowerCase())) {
      const month = item.periode_update;
      const jumlah = parseInt(item.jumlah, 10);
      
      if (!monthMap.has(month)) {
        monthMap.set(month, 0);
      }
      monthMap.set(month, monthMap.get(month)! + jumlah);
    }
  });
  
  return Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getUniqueDiseasesJatim(data: JawaTimurDataItem[]): string[] {
  const diseases = new Set<string>();
  data.forEach(item => diseases.add(item.penyakit));
  return Array.from(diseases).sort();
}

export function calculateSummary(jakartaData2022: JakartaDataItem[], jakartaData2023: JakartaDataItem[]) {
  const totalDifteri2022 = jakartaData2022.reduce((sum, item) => {
    return sum + parseInt(item.jumlah_difteri || item.jumlah || '0', 10);
  }, 0);
  
  const totalDifteri2023 = jakartaData2023.reduce((sum, item) => {
    return sum + parseInt(item.jumlah || '0', 10);
  }, 0);
  
  return {
    totalDifteri2022,
    totalDifteri2023,
    change: totalDifteri2023 - totalDifteri2022,
    changePercent: ((totalDifteri2023 - totalDifteri2022) / totalDifteri2022 * 100).toFixed(1),
  };
}
