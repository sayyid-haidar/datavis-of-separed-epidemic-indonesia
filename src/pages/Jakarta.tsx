import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { fetchUnifiedData, getJakartaDistrictData, getJakartaYearComparison } from '@/lib/data-utils';
import type { UnifiedData } from '@/lib/data-utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function Jakarta() {
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'2022' | '2023' | '2024'>('2023');

  useEffect(() => {
    async function loadData() {
      try {
        const unifiedData = await fetchUnifiedData();
        setData(unifiedData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const jakartaData = data.data.jakarta;
  const years = Object.keys(jakartaData) as ('2022' | '2023' | '2024')[];
  
  // Get data for selected year
  const districtData = getJakartaDistrictData(data, selectedYear, 'difteri');
  const yearComparison = getJakartaYearComparison(data, 'difteri');
  
  // Calculate totals
  const currentYearSummary = jakartaData[selectedYear]?.summary;
  const prevYear = selectedYear === '2023' ? '2022' : selectedYear === '2024' ? '2023' : null;
  const prevYearSummary = prevYear ? jakartaData[prevYear]?.summary : null;

  const totalDifteri = currentYearSummary?.difteri?.total || 0;
  const prevTotalDifteri = prevYearSummary?.difteri?.total || 0;
  const change = totalDifteri - prevTotalDifteri;
  const changePercent = prevTotalDifteri > 0 ? ((change / prevTotalDifteri) * 100).toFixed(1) : '0';

  // Available diseases for the selected year
  const diseases = currentYearSummary ? Object.keys(currentYearSummary) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Jakarta</h2>
        <p className="text-muted-foreground">
          Data penyakit menular DKI Jakarta
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Perbandingan Tahun</TabsTrigger>
          <TabsTrigger value="detail">Detail per Wilayah</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Year Selector */}
          <div className="flex gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {year}
                {jakartaData[year]?.isEstimated && ' (Est.)'}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Difteri {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDifteri}</div>
                {prevYear && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {change >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                    )}
                    <span className={change >= 0 ? 'text-destructive' : 'text-green-500'}>
                      {change >= 0 ? '+' : ''}{changePercent}% dari {prevYear}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {diseases.map((disease) => {
              const diseaseData = currentYearSummary?.[disease];
              if (!diseaseData || disease === 'difteri') return null;
              return (
                <Card key={disease}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {disease.replace('-', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{diseaseData.total}</div>
                    <p className="text-xs text-muted-foreground">
                      L: {diseaseData.laki} | P: {diseaseData.perempuan}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* District Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kasus Difteri per Wilayah {selectedYear}</CardTitle>
              <CardDescription>
                Sumber: {jakartaData[selectedYear]?.source}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={districtData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="laki" name="Laki-laki" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perempuan" name="Perempuan" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Difteri Jakarta 2022-2024</CardTitle>
              <CardDescription>Perbandingan total kasus per tahun</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={yearComparison} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="laki" stroke="#8b5cf6" strokeWidth={2} name="Laki-laki" />
                  <Line type="monotone" dataKey="perempuan" stroke="#ec4899" strokeWidth={2} name="Perempuan" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year over year comparison table */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Tahunan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {yearComparison.map((item) => (
                  <div key={item.year} className={`p-4 rounded-lg ${item.isEstimated ? 'bg-muted/50 border border-dashed' : 'bg-muted'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{item.year}</span>
                      {item.isEstimated && <Badge variant="outline">Estimasi</Badge>}
                    </div>
                    <div className="text-3xl font-bold">{item.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="text-blue-500">L: {item.laki}</span> | <span className="text-pink-500">P: {item.perempuan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jakartaData[selectedYear]?.cases.map((district) => {
              const districtInfo = data.regions.jakarta.districts?.find(d => d.id === district.district);
              
              return (
                <Card key={district.district}>
                  <CardHeader>
                    <CardTitle className="text-lg">{districtInfo?.name || district.district}</CardTitle>
                    <CardDescription>{districtInfo?.type === 'kab_adm' ? 'Kabupaten Adm.' : 'Kota Adm.'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(district.diseases).map(([disease, counts]) => (
                        <div key={disease} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{disease.replace('-', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={(counts as { total: number }).total > 10 ? 'destructive' : (counts as { total: number }).total > 0 ? 'default' : 'outline'}>
                              {(counts as { total: number }).total}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
