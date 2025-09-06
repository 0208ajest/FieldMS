'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardProps {
  onNavigateToDispatch: () => void;
}

export default function Dashboard({ onNavigateToDispatch }: DashboardProps) {
  // モックデータ
  const scheduleData = [
    { date: '1/1', scheduled: 12, completed: 10 },
    { date: '1/2', scheduled: 15, completed: 14 },
    { date: '1/3', scheduled: 18, completed: 16 },
    { date: '1/4', scheduled: 20, completed: 18 },
    { date: '1/5', scheduled: 16, completed: 15 },
    { date: '1/6', scheduled: 14, completed: 13 },
    { date: '1/7', scheduled: 22, completed: 20 },
  ];

  const engineerUtilizationData = [
    { name: '田中', utilization: 85 },
    { name: '山田', utilization: 92 },
    { name: '佐藤', utilization: 78 },
    { name: '鈴木', utilization: 88 },
    { name: '高橋', utilization: 95 },
  ];

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ダッシュボード</h1>
          <p className="text-muted-foreground">システム概要とクイックアクション</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">レポート出力</Button>
          <Button size="sm">新規作業指示</Button>
        </div>
      </div>

      {/* 統計カードエリア: 4列グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 統計カード1: アクティブエンジニア */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">アクティブエンジニア</p>
              <p className="text-2xl font-bold text-primary">24</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="text-green-600">↗ +12%</span>
            <span className="text-muted-foreground ml-1">前月比</span>
          </div>
        </Card>
        
        {/* 統計カード2: 今日のスケジュール */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今日のスケジュール</p>
              <p className="text-2xl font-bold text-blue-600">18</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="text-orange-600">3件進行中</span>
          </div>
        </Card>

        {/* 統計カード3: 作業指示書 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">未割り当て指示書</p>
              <p className="text-2xl font-bold text-orange-600">7</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clipboard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={onNavigateToDispatch}>
              割り当て画面へ
            </Button>
          </div>
        </Card>

        {/* 統計カード4: 完了率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今月完了率</p>
              <p className="text-2xl font-bold text-green-600">94%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={94} className="h-2" />
          </div>
        </Card>
      </div>

      {/* メインコンテンツエリア: 2列レイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左カラム: チャートエリア (2/3幅) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 月間スケジュール推移チャート */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">月間スケジュール推移</h3>
              <Select defaultValue="30days">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="期間" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">過去7日</SelectItem>
                  <SelectItem value="30days">過去30日</SelectItem>
                  <SelectItem value="90days">過去90日</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* recharts LineChart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scheduleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="scheduled" stroke="#ff6b35" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* エンジニア稼働率チャート */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">エンジニア稼働率</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engineerUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 右カラム: アクティビティフィード (1/3幅) */}
        <div className="space-y-6">
          
          {/* 最近のアクティビティ */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">最近のアクティビティ</h3>
            <div className="space-y-4">
              {/* アクティビティアイテム */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">作業完了</p>
                  <p className="text-xs text-muted-foreground">田中エンジニア - サーバー保守</p>
                  <p className="text-xs text-muted-foreground">5分前</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">新規スケジュール</p>
                  <p className="text-xs text-muted-foreground">山田エンジニア - 15:00-17:00</p>
                  <p className="text-xs text-muted-foreground">15分前</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">緊急作業指示</p>
                  <p className="text-xs text-muted-foreground">ネットワーク障害対応</p>
                  <p className="text-xs text-muted-foreground">30分前</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              すべて表示
            </Button>
          </Card>

          {/* クイックスタッツ */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">今日の概要</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">進行中</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">3件</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">完了</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">8件</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">予定</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">7件</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

