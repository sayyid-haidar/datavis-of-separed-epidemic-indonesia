import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  fetchUnifiedData, 
  getCirebonYearlyTrend, 
  getCirebonBySubdistrict,
  getBogorYearlyTrend,
  getBogorBySubdistrict
} from '@/lib/data-utils';
import type { UnifiedData } from '@/lib/data-utils';
import { MapPin, TrendingUp, AlertCircle, Activity } from 'lucide-react';

export function Regional() {
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Cirebon data
  const cirebonTrend = getCirebonYearlyTrend(data);
  const cirebonBySubdistrict = getCirebonBySubdistrict(data);
  
  // Bogor data
  const bogorTrend = getBogorYearlyTrend(data);
  const bogorBySubdistrict = getBogorBySubdistrict(data);
  
  // Jawa Timur data
  const jatimData = data.data.jatim;
  const jatimYearlyTrend = Object.entries(jatimData.yearlyData).map(([year, yearData]) => ({
    year,
    total: yearData.summary.totalCases,
    dengue: yearData.diseases?.dengue?.total || 0,
    diare: yearData.diseases?.['diare-akut']?.total || 0,
    campak: yearData.diseases?.campak?.total || 0,
    pneumonia: yearData.diseases?.pneumonia?.total || 0,
  }));

  const jatimDiseaseComparison = jatimData.diseaseTypes.slice(0, 8).map(disease => {
    const totals = Object.values(jatimData.yearlyData).reduce((sum, yearData) => {
      return sum + (yearData.diseases?.[disease.id]?.total || 0);
    }, 0);
    return { name: disease.name.replace('Suspek ', '').replace(' / DBD', ''), total: totals };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Regional</h2>
        <p className="text-muted-foreground">
          Data wabah dan penyakit dari berbagai wilayah di Jawa Barat dan Jawa Timur
        </p>
      </div>

      <Tabs defaultValue="jatim" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jatim">Jawa Timur</TabsTrigger>
          <TabsTrigger value="cirebon">Kota Cirebon</TabsTrigger>
          <TabsTrigger value="bogor">Kab. Bogor</TabsTrigger>
        </TabsList>

        {/* JAWA TIMUR TAB */}
        <TabsContent value="jatim" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Kasus (2021-2025)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jatimData.summary.totalAllYears.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Peak: {jatimData.summary.peakCount.toLocaleString()} ({jatimData.summary.peakYear})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dengue 2025</CardTitle>
                <TrendingUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {jatimData.yearlyData['2025']?.diseases?.dengue?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Naik dari {jatimData.yearlyData['2024']?.diseases?.dengue?.total || 0} (2024)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Campak 2025</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {jatimData.yearlyData['2025']?.diseases?.campak?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{(((jatimData.yearlyData['2025']?.diseases?.campak?.total || 0) / (jatimData.yearlyData['2024']?.diseases?.campak?.total || 1) - 1) * 100).toFixed(0)}% dari 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jenis Penyakit</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jatimData.diseaseTypes.length}</div>
                <p className="text-xs text-muted-foreground">penyakit dipantau</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Kasus Tahunan</CardTitle>
                <CardDescription>Total kasus potensial wabah per tahun</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={jatimYearlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                    <Area type="monotone" dataKey="dengue" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} name="Dengue" />
                    <Area type="monotone" dataKey="diare" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Diare Akut" />
                    <Area type="monotone" dataKey="campak" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Campak" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Jenis Penyakit</CardTitle>
                <CardDescription>Total kasus per jenis penyakit (2021-2025)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jatimDiseaseComparison} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total Kasus" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insight Jawa Timur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(jatimData.insights).map(([key, insight]) => (
                  <div key={key} className="p-4 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{insight.description}</p>
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      {'cases2024' in insight && <span>2024: {insight.cases2024}</span>}
                      {'cases2025' in insight && <span>2025: {insight.cases2025}</span>}
                      {'peak2022' in insight && <span>Peak 2022: {insight.peak2022}</span>}
                      {'current2024' in insight && <span>2024: {insight.current2024}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CIREBON TAB */}
        <TabsContent value="cirebon" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Kasus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.cirebon.summary.totalAllYears}</div>
                <p className="text-xs text-muted-foreground">{data.data.cirebon.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peak Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.cirebon.summary.peakYear}</div>
                <p className="text-xs text-muted-foreground">{data.data.cirebon.summary.peakCount} kasus</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hotspot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{data.data.cirebon.summary.hotspot}</div>
                <p className="text-xs text-muted-foreground">Kecamatan dengan kasus terbanyak</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Tahunan Cirebon</CardTitle>
                <CardDescription>Kasus wabah hewan 2018-2024</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cirebonTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total Kasus" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kasus per Kecamatan</CardTitle>
                <CardDescription>Total kumulatif 2018-2024</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cirebonBySubdistrict} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Kasus" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BOGOR TAB */}
        <TabsContent value="bogor" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Kasus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.bogor.summary.totalAllYears}</div>
                <p className="text-xs text-muted-foreground">{data.data.bogor.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peak Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.bogor.summary.peakYear}</div>
                <p className="text-xs text-muted-foreground">{data.data.bogor.summary.peakCount} kasus</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hotspot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{data.data.bogor.summary.hotspot.replace('-', ' ')}</div>
                <p className="text-xs text-muted-foreground">Kecamatan dengan kasus terbanyak</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Tahunan Bogor</CardTitle>
                <CardDescription>Jumlah wabah lainnya 2020-2024</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bogorTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} name="Total Kasus" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kasus per Kecamatan</CardTitle>
                <CardDescription>Total kumulatif 2020-2024</CardDescription>
              </CardHeader>
              <CardContent>
                {bogorBySubdistrict.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bogorBySubdistrict} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Total Kasus" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Hanya ada kasus di tahun 2022
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
