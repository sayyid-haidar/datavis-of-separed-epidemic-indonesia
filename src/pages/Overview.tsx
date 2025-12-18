import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  fetchUnifiedData,
  getJakartaDistrictData,
  getCirebonYearlyTrend,
  getSummaryStats,
} from '@/lib/data-utils';
import type { UnifiedData } from '@/lib/data-utils';
import { TrendingUp, TrendingDown, Activity, MapPin, AlertTriangle, Bug, Stethoscope } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Overview() {
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

  // Get summary stats from unified data
  const stats = getSummaryStats(data);
  
  // Chart data
  const jakartaDistrictData = getJakartaDistrictData(data, '2023', 'difteri');
  const cirebonTrendData = getCirebonYearlyTrend(data);
  
  // Jawa Timur trend data - with null safety
  const jatimYearlyData = data.data.jatim?.yearlyData || {};
  const jatimTrendData = Object.entries(jatimYearlyData).map(([year, yearData]) => ({
    year,
    total: yearData?.summary?.totalCases || 0,
    dengue: yearData?.diseases?.dengue?.total || 0,
    diare: yearData?.diseases?.['diare-akut']?.total || 0,
  }));

  // Disease distribution for Jakarta 2023 - with null safety
  const jakarta2023 = data.data.jakarta?.['2023'];
  const diseaseDistribution = jakarta2023 ? [
    { name: 'Difteri', value: jakarta2023.summary?.difteri?.total || 0 },
    { name: 'Pertusis', value: jakarta2023.summary?.pertusis?.total || 0 },
  ] : [];


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Ringkasan data wabah dan penyakit menular di Indonesia ({data.metadata.lastUpdated})
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Difteri Jakarta 2023</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jakartaDifteri2023}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.difteriChange >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-destructive" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              )}
              <span className={stats.difteriChange >= 0 ? 'text-destructive' : 'text-green-500'}>
                {stats.difteriChange >= 0 ? '+' : ''}{stats.difteriChangePercent}%
              </span>
              <span className="ml-1">dari 2022</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kasus Jawa Timur</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.data.jatim?.summary?.totalAllYears || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(data.data.jatim?.summary?.mainDiseases || []).slice(0, 2).join(', ') || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wabah Cirebon</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cirebonTotal}</div>
            <p className="text-xs text-muted-foreground">
              Peak: {stats.cirebonPeak} kasus ({stats.cirebonPeakYear})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <Badge variant="warning">Waspada</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Dengue melonjak di Jatim 2024-2025
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kasus Difteri per Wilayah Jakarta 2023</CardTitle>
            <CardDescription>Distribusi kasus berdasarkan jenis kelamin</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jakartaDistrictData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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

        <Card>
          <CardHeader>
            <CardTitle>Tren Kasus Jawa Timur</CardTitle>
            <CardDescription>Total kasus potensial wabah per tahun (2021-2025)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={jatimTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Total Kasus" />
                <Area type="monotone" dataKey="dengue" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Dengue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Wabah Cirebon</CardTitle>
            <CardDescription>Kasus wabah hewan 2018-2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cirebonTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                  name="Total Kasus"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Penyakit Jakarta 2023</CardTitle>
            <CardDescription>Proporsi jenis penyakit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {diseaseDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insight & Rekomendasi</CardTitle>
          <CardDescription>Temuan penting dari analisis data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.analytics.hotspots.map((hotspot, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Bug className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{hotspot.region.replace('-', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {hotspot.cases} kasus {hotspot.disease} ({hotspot.year})
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <p className="font-medium text-sm">Rekomendasi:</p>
            <ul className="space-y-1">
              {data.analytics.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
