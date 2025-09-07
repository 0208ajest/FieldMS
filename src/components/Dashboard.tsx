'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Calendar, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getEngineers, getWorkOrders, getSchedules } from '@/lib/firestore';
import { Engineer, WorkOrder, Schedule } from '@/types';

interface DashboardProps {
  onNavigateToDispatch: () => void;
  currentUser?: { name: string; companyId: number };
}

export default function Dashboard({ onNavigateToDispatch, currentUser }: DashboardProps) {
  const [isAllActivitiesOpen, setIsAllActivitiesOpen] = useState(false);

  // 実際のデータを管理するstate
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // エンジニア、作業指示、スケジュールデータを並行取得
        const [firestoreEngineers, firestoreWorkOrders, firestoreSchedules] = await Promise.all([
          getEngineers(),
          getWorkOrders(),
          getSchedules()
        ]);

        // エンジニアデータを変換
        const convertedEngineers: Engineer[] = firestoreEngineers.map((firestoreEngineer) => ({
          id: firestoreEngineer.id as string,
          name: firestoreEngineer.name as string,
          email: firestoreEngineer.email as string,
          phone: (firestoreEngineer.phone as string) || '',
          departmentId: parseInt(firestoreEngineer.companyId as string) || 1,
          skills: (firestoreEngineer.skills as string[]) || [],
          status: firestoreEngineer.status as 'active' | 'inactive',
          totalProjects: 0,
          completedProjects: 0,
          createdAt: firestoreEngineer.createdAt as Date,
          updatedAt: firestoreEngineer.updatedAt as Date,
        }));

        // 作業指示データを変換
        const convertedWorkOrders: WorkOrder[] = firestoreWorkOrders.map(firestoreWorkOrder => ({
          id: parseInt(firestoreWorkOrder.id) || 0,
          title: firestoreWorkOrder.title,
          description: firestoreWorkOrder.description,
          location: firestoreWorkOrder.location,
          priority: firestoreWorkOrder.priority,
          status: firestoreWorkOrder.status,
          assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
          estimatedDuration: firestoreWorkOrder.estimatedDuration,
          actualDuration: firestoreWorkOrder.actualDuration,
          createdAt: firestoreWorkOrder.createdAt,
          completedAt: firestoreWorkOrder.completedAt,
          dueDate: firestoreWorkOrder.dueDate,
          firebaseId: firestoreWorkOrder.id
        }));

        // スケジュールデータを変換
        const convertedSchedules: Schedule[] = firestoreSchedules.map(firestoreSchedule => ({
          id: parseInt(firestoreSchedule.id) || 0,
          title: firestoreSchedule.title,
          description: firestoreSchedule.description,
          engineerId: firestoreSchedule.engineerId || '',
          engineerName: firestoreSchedule.engineerName,
          startDate: firestoreSchedule.startTime.toISOString().split('T')[0],
          endDate: firestoreSchedule.endTime.toISOString().split('T')[0],
          status: firestoreSchedule.status,
          priority: firestoreSchedule.priority || 'medium',
          workOrderId: firestoreSchedule.workOrderId ? parseInt(firestoreSchedule.workOrderId) : null,
          location: firestoreSchedule.location,
          firebaseId: firestoreSchedule.id
        }));

        setEngineers(convertedEngineers);
        setWorkOrders(convertedWorkOrders);
        setSchedules(convertedSchedules);
      } catch (err) {
        console.error('ダッシュボードデータ取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 実際のデータから計算される統計情報
  const activeEngineers = engineers.filter(e => e.status === 'active').length;
  const todaySchedules = schedules.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.startDate === today;
  }).length;
  const inProgressWorkOrders = workOrders.filter(w => w.status === 'in_progress').length;
  const completedWorkOrders = workOrders.filter(w => w.status === 'completed').length;
  const totalWorkOrders = workOrders.length;
  const completionRate = totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0;

  // 過去7日間のスケジュールデータ
  const scheduleData = (() => {
    const data: Array<{ date: string; scheduled: number; completed: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const scheduled = schedules.filter(s => s.startDate === dateStr).length;
      const completed = schedules.filter(s => s.startDate === dateStr && s.status === 'completed').length;
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        scheduled,
        completed
      });
    }
    return data;
  })();

  // エンジニア稼働率データ
  const engineerUtilizationData = engineers.slice(0, 5).map(engineer => {
    const engineerSchedules = schedules.filter(s => s.engineerId === engineer.id);
    const completedSchedules = engineerSchedules.filter(s => s.status === 'completed').length;
    const utilization = engineerSchedules.length > 0 ? Math.round((completedSchedules / engineerSchedules.length) * 100) : 0;
    return {
      name: engineer.name,
      utilization
    };
  });

  // 最近のアクティビティ
  const allActivities = (() => {
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      time: string;
      description: string;
      icon?: React.ComponentType<{ className?: string }>;
      color?: string;
    }> = [];
    
    // 最近の作業指示完了
    const recentCompletedWorkOrders = workOrders
      .filter(w => w.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .slice(0, 3);
    
    recentCompletedWorkOrders.forEach(workOrder => {
      const timeDiff = Date.now() - new Date(workOrder.completedAt || workOrder.createdAt).getTime();
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const timeStr = minutes < 60 ? `${minutes}分前` : `${Math.floor(minutes / 60)}時間前`;
      
      activities.push({
        id: `completed-${workOrder.id}`,
        type: 'completed',
        title: '作業完了',
        description: `${workOrder.title}`,
        time: timeStr,
        icon: CheckCircle,
        color: 'green'
      });
    });

    // 最近のスケジュール作成
    const recentSchedules = schedules
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 2);
    
    recentSchedules.forEach(schedule => {
      const timeDiff = Date.now() - new Date(schedule.startDate).getTime();
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const timeStr = minutes < 60 ? `${minutes}分前` : `${Math.floor(minutes / 60)}時間前`;
      
      activities.push({
        id: `schedule-${schedule.id}`,
        type: 'schedule',
        title: '新規スケジュール',
        description: `${schedule.engineerName || 'エンジニア'} - ${schedule.title}`,
        time: timeStr,
        icon: Calendar,
        color: 'blue'
      });
    });

    // 緊急作業指示
    const urgentWorkOrders = workOrders
      .filter(w => w.priority === 'urgent' && w.status !== 'completed')
      .slice(0, 1);
    
    urgentWorkOrders.forEach(workOrder => {
      activities.push({
        id: `urgent-${workOrder.id}`,
        type: 'urgent',
        title: '緊急作業指示',
        description: workOrder.title,
        time: '現在',
        icon: AlertTriangle,
        color: 'orange'
      });
    });

    return activities.sort((a, b) => {
      const timeA = a.time.includes('分前') ? parseInt(a.time) : 
                   a.time.includes('時間前') ? parseInt(a.time) * 60 : 0;
      const timeB = b.time.includes('分前') ? parseInt(b.time) : 
                   b.time.includes('時間前') ? parseInt(b.time) * 60 : 0;
      return timeA - timeB;
    }).slice(0, 6);
  })();


  // ローディング状態
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">ダッシュボードデータを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-muted-foreground text-sm mt-2">ページを再読み込みしてください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            ようこそ{currentUser?.name ? ` ${currentUser.name}` : ''}さん
          </h1>
          <p className="text-muted-foreground">システム概要とクイックアクション</p>
        </div>
      </div>

      {/* 統計カードエリア: 4列グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 統計カード1: アクティブエンジニア */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">アクティブエンジニア</p>
              <p className="text-2xl font-bold text-primary">{activeEngineers}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="text-muted-foreground">総数: {engineers.length}人</span>
          </div>
        </Card>
        
        {/* 統計カード2: 今日のスケジュール */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今日のスケジュール</p>
              <p className="text-2xl font-bold text-blue-600">{todaySchedules}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="text-orange-600">{inProgressWorkOrders}件進行中</span>
          </div>
        </Card>

        {/* 統計カード3: 作業指示書 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">未割り当て指示書</p>
              <p className="text-2xl font-bold text-orange-600">{workOrders.filter(w => w.status === 'pending').length}</p>
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
              <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={completionRate} className="h-2" />
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
            
            <Dialog open={isAllActivitiesOpen} onOpenChange={setIsAllActivitiesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  すべて表示
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>すべてのアクティビティ</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {allActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                          {IconComponent && <IconComponent className={`w-4 h-4 text-${activity.color}-600`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsAllActivitiesOpen(false)}>
                    閉じる
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

