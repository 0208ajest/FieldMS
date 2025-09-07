'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, X, User, AlertTriangle } from 'lucide-react';
import { User as UserType, Schedule } from '@/types';
import { engineers } from '@/components/data/engineerData';
import { 
  addSchedule, 
  getSchedules, 
  updateSchedule, 
  getEngineers
} from '@/lib/firestore';

interface ScheduleCalendarProps {
  currentUser: UserType;
  engineerFilter?: string | null;
}

export default function ScheduleCalendar({ engineerFilter }: ScheduleCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [schedulesList, setSchedulesList] = useState<Schedule[]>([]);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [recommendedEngineers, setRecommendedEngineers] = useState<typeof engineers>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // エンジニアデータ（Firebaseから取得）
  const [firebaseEngineers, setFirebaseEngineers] = useState<typeof engineers>([]);
  
  // スケジュール詳細表示
  const [isScheduleDetailsOpen, setIsScheduleDetailsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // スケジュール編集
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    engineerId: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    status: 'scheduled',
    priority: 'medium',
    estimatedDuration: '',
    location: '',
    customerName: '',
    customerPhone: ''
  });

  // Firebaseからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📅 データ一覧を取得中...');
        
        // エンジニアデータを取得
        const firestoreEngineers = await getEngineers();
        console.log('👨‍💻 取得したFirestoreエンジニア:', firestoreEngineers);
        
        const convertedEngineers = firestoreEngineers.map((firestoreEngineer) => ({
          id: firestoreEngineer.id as string, // FirebaseのIDをそのまま使用
          name: firestoreEngineer.name as string,
          email: firestoreEngineer.email as string,
          phone: (firestoreEngineer.phone as string) || '',
          departmentId: parseInt(firestoreEngineer.companyId as string) || 1,
          skills: firestoreEngineer.skills as string[],
          status: firestoreEngineer.status as 'active' | 'inactive',
          totalProjects: 0, // 後で計算
          completedProjects: 0, // 後で計算
          createdAt: firestoreEngineer.createdAt as Date,
          updatedAt: firestoreEngineer.updatedAt as Date,
        }));
        setFirebaseEngineers(convertedEngineers);
        
        // スケジュールデータを取得
        const firestoreSchedules = await getSchedules();
        console.log('📅 取得したFirestoreスケジュール:', firestoreSchedules);
        
        // FirestoreScheduleをSchedule型に変換
        const convertedSchedules: Schedule[] = firestoreSchedules.map(firestoreSchedule => ({
          id: parseInt(firestoreSchedule.id) || 0, // 数値IDに変換（既存のUIとの互換性のため）
          title: firestoreSchedule.title,
          description: firestoreSchedule.description,
          engineerId: firestoreSchedule.engineerId || '', // 文字列IDをそのまま使用
          engineerName: firestoreSchedule.engineerName || '',
          startDate: firestoreSchedule.startTime.toISOString(),
          endDate: firestoreSchedule.endTime.toISOString(),
          status: firestoreSchedule.status,
          priority: firestoreSchedule.priority || 'medium',
          workOrderId: parseInt(firestoreSchedule.workOrderId || '0') || 0,
          location: firestoreSchedule.location,
          customerName: '',
          customerPhone: '',
          // Firebaseの実際のドキュメントIDを保持
          firebaseId: firestoreSchedule.id
        }));
        
        console.log('📅 変換後のスケジュールデータ:', convertedSchedules);
        setSchedulesList(convertedSchedules);
      } catch (err) {
        console.error('❌ データ取得エラー:', err);
        setError(`データの取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 現在の月のカレンダーデータを生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const daySchedules = schedulesList.filter(schedule => {
        const scheduleDate = new Date(schedule.startDate);
        return scheduleDate.toDateString() === current.toDateString() &&
               (!engineerFilter || schedule.engineerId === engineerFilter);
      });
      
      days.push({
        date: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        fullDate: new Date(current),
        schedules: daySchedules.map(schedule => ({
          ...schedule,
          engineerName: firebaseEngineers.find(e => e.id === schedule.engineerId)?.name || '不明',
          startTime: new Date(schedule.startDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        }))
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // スケジュール重複チェック
  const checkScheduleConflict = (engineerId: string, startDateTime: Date, endDateTime: Date) => {
    const conflicts = schedulesList.filter(schedule => {
      if (schedule.engineerId !== engineerId) return false;
      
      const existingStart = new Date(schedule.startDate);
      const existingEnd = new Date(schedule.endDate);
      
      return (startDateTime < existingEnd && endDateTime > existingStart);
    });
    
    return conflicts;
  };

  // 新規スケジュール作成
  const handleCreateSchedule = async () => {
    try {
      if (!newSchedule.engineerId || !newSchedule.startDate || !newSchedule.startTime) {
        setConflictAlert('必須項目を入力してください');
        return;
      }

      const startDateTime = new Date(`${newSchedule.startDate}T${newSchedule.startTime}`);
      const endDateTime = new Date(`${newSchedule.endDate || newSchedule.startDate}T${newSchedule.endTime || newSchedule.startTime}`);
      
      const conflicts = checkScheduleConflict(newSchedule.engineerId, startDateTime, endDateTime);
      
      if (conflicts.length > 0) {
        const engineerName = firebaseEngineers.find(e => e.id === newSchedule.engineerId)?.name;
        setConflictAlert(`${engineerName}エンジニアのスケジュールが重複しています。時間を調整してください。`);
        return;
      }

      setLoading(true);
      setError(null);

      // Firestoreに保存するスケジュールデータを作成
      const scheduleData = {
        title: newSchedule.title,
        description: newSchedule.description,
        startTime: startDateTime,
        endTime: endDateTime,
        engineerId: newSchedule.engineerId,
        engineerName: firebaseEngineers.find(e => e.id === newSchedule.engineerId)?.name || '',
        workOrderId: '', // 作業指示IDは後で設定
        status: newSchedule.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        location: newSchedule.location,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('📅 新規スケジュール追加データ:', scheduleData);

      // Firestoreにスケジュールを追加
      const newScheduleId = await addSchedule(scheduleData);
      console.log('✅ 新しいスケジュールが追加されました, ID:', newScheduleId);

      // スケジュール一覧を再取得
      const updatedFirestoreSchedules = await getSchedules();
      const updatedConvertedSchedules: Schedule[] = updatedFirestoreSchedules.map(firestoreSchedule => ({
        id: parseInt(firestoreSchedule.id) || 0,
        title: firestoreSchedule.title,
        description: firestoreSchedule.description,
          engineerId: firestoreSchedule.engineerId || '',
        engineerName: firestoreSchedule.engineerName || '',
        startDate: firestoreSchedule.startTime.toISOString(),
        endDate: firestoreSchedule.endTime.toISOString(),
        status: firestoreSchedule.status,
        priority: firestoreSchedule.priority || 'medium',
        workOrderId: parseInt(firestoreSchedule.workOrderId || '0') || 0,
        location: firestoreSchedule.location,
        customerName: '',
        customerPhone: '',
        firebaseId: firestoreSchedule.id
      }));
      
      setSchedulesList(updatedConvertedSchedules);
      setIsNewScheduleOpen(false);
      setConflictAlert(null);
      setRecommendedEngineers([]);
      setNewSchedule({
        title: '',
        description: '',
        engineerId: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        status: 'scheduled',
        priority: 'medium',
        estimatedDuration: '',
        location: '',
        customerName: '',
        customerPhone: ''
      });
    } catch (err) {
      console.error('❌ スケジュール追加エラー:', err);
      setError(`スケジュールの追加に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = generateCalendarDays();
  const filteredEngineer = engineerFilter ? firebaseEngineers.find(e => e.id === engineerFilter) : null;

  // 週間表示用のデータ生成
  const generateWeekData = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays: Array<{ date: Date; dayName: string; isToday: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayName = ['日', '月', '火', '水', '木', '金', '土'][i];
      const isToday = date.toDateString() === new Date().toDateString();
      weekDays.push({ date, dayName, isToday });
    }
    
    return weekDays;
  };

  // 日間表示用のデータ生成（24時間）
  const generateDayData = () => {
    const hours: number[] = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // スケジュールを時間別に取得
  const getSchedulesForDate = (date: Date) => {
    return schedulesList.filter(schedule => {
      const scheduleDate = new Date(schedule.startDate);
      return scheduleDate.toDateString() === date.toDateString() &&
             (!engineerFilter || schedule.engineerId === engineerFilter);
    });
  };

  // スケジュールを時間別に取得
  const getSchedulesForHour = (date: Date, hour: number) => {
    return schedulesList.filter(schedule => {
      const scheduleDate = new Date(schedule.startDate);
      const scheduleHour = scheduleDate.getHours();
      return scheduleDate.toDateString() === date.toDateString() &&
             scheduleHour === hour &&
             (!engineerFilter || schedule.engineerId === engineerFilter);
    });
  };

  // 推奨エンジニアを取得（該当日時の稼働状況を動的チェック）
  const getRecommendedEngineers = (date: string, startTime?: string, endTime?: string) => {
    if (!date) {
      setRecommendedEngineers([]);
      return;
    }

    // 該当日時のスケジュール時間を計算
    const scheduleStartTime = startTime || '09:00';
    const scheduleEndTime = endTime || '18:00';
    const scheduleStartDateTime = new Date(`${date}T${scheduleStartTime}`);
    const scheduleEndDateTime = new Date(`${date}T${scheduleEndTime}`);

    console.log('🔍 推奨エンジニア検索:', { 
      date, 
      startTime: scheduleStartTime, 
      endTime: scheduleEndTime,
      scheduleStartDateTime,
      scheduleEndDateTime
    });

    // 各エンジニアの該当日時の稼働状況をチェック
    const engineersWithAvailability = firebaseEngineers.map(engineer => {
      // 該当エンジニアの該当日時のスケジュールを取得
      const engineerSchedules = schedulesList.filter(schedule => {
        if (schedule.engineerId !== engineer.id) return false;
        
        const scheduleDate = new Date(schedule.startDate);
        const scheduleEndDate = new Date(schedule.endDate);
        
        // 同じ日付のスケジュールをチェック
        return scheduleDate.toDateString() === scheduleStartDateTime.toDateString() ||
               scheduleEndDate.toDateString() === scheduleStartDateTime.toDateString();
      });

      // 時間重複をチェック
      const hasConflict = engineerSchedules.some(schedule => {
        const existingStart = new Date(schedule.startDate);
        const existingEnd = new Date(schedule.endDate);
        
        // 時間が重複しているかチェック
        return (scheduleStartDateTime < existingEnd && scheduleEndDateTime > existingStart);
      });

      // 稼働状況を決定（時間範囲での重複のみをチェック）
      let availabilityStatus: 'available' | 'busy' | 'partial';
      if (hasConflict) {
        availabilityStatus = 'busy';
      } else {
        availabilityStatus = 'available'; // 時間重複がなければ空きあり
      }

      return {
        ...engineer,
        availabilityStatus,
        conflictCount: engineerSchedules.length
      };
    });

    // 稼働状況に基づいてソート（空いているエンジニアを優先）
    const sortedEngineers = engineersWithAvailability.sort((a, b) => {
      const statusPriority = { 'available': 0, 'partial': 1, 'busy': 2 };
      const aPriority = statusPriority[a.availabilityStatus];
      const bPriority = statusPriority[b.availabilityStatus];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // 同じ稼働状況の場合は、スケジュール数が少ない方を優先
      return a.conflictCount - b.conflictCount;
    });

    console.log('🔍 推奨エンジニア結果:', sortedEngineers);
    setRecommendedEngineers(sortedEngineers.slice(0, 3)); // 上位3名をレコメンド
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      // 週間表示の場合は7日ずつ移動
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'day') {
      // 日間表示の場合は1日ずつ移動
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      // 月間表示の場合は1ヶ月ずつ移動
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const clearFilter = () => {
    // 親コンポーネントにフィルタークリアを通知
    window.location.reload(); // 簡易実装
  };

  const openNewScheduleDialog = (day: { date: number; isCurrentMonth: boolean; isToday: boolean; fullDate: Date; schedules: Array<{ id: number; title: string; engineerName: string; startTime: string; status: string }> }) => {
    setNewSchedule({
      ...newSchedule,
      startDate: day.fullDate.toISOString().split('T')[0],
      endDate: day.fullDate.toISOString().split('T')[0]
    });
    setIsNewScheduleOpen(true);
    getRecommendedEngineers(day.fullDate.toISOString().split('T')[0], newSchedule.startTime, newSchedule.endTime);
  };

  // 開始日の変更ハンドラー
  const handleStartDateChange = (startDate: string) => {
    setNewSchedule({...newSchedule, startDate});
    if (startDate) {
      getRecommendedEngineers(startDate, newSchedule.startTime, newSchedule.endTime);
    }
  };

  // 開始時間の変更ハンドラー
  const handleStartTimeChange = (startTime: string) => {
    setNewSchedule({...newSchedule, startTime});
    if (newSchedule.startDate) {
      getRecommendedEngineers(newSchedule.startDate, startTime, newSchedule.endTime);
    }
  };

  // 終了日の変更ハンドラー
  const handleEndDateChange = (endDate: string) => {
    setNewSchedule({...newSchedule, endDate});
    if (endDate) {
      getRecommendedEngineers(endDate, newSchedule.startTime, newSchedule.endTime);
    }
  };

  // 終了時間の変更ハンドラー
  const handleEndTimeChange = (endTime: string) => {
    setNewSchedule({...newSchedule, endTime});
    if (newSchedule.startDate) {
      getRecommendedEngineers(newSchedule.startDate, newSchedule.startTime, endTime);
    }
  };

  const openScheduleDetails = (schedule: Schedule) => {
    console.log('スケジュール詳細:', schedule);
    setSelectedSchedule(schedule);
    setIsScheduleDetailsOpen(true);
  };

  const openEditSchedule = (schedule: Schedule) => {
    console.log('スケジュール編集:', schedule);
    setEditSchedule(schedule);
    setIsEditScheduleOpen(true);
  };

  const handleUpdateSchedule = async () => {
    if (!editSchedule) return;

    try {
      setLoading(true);
      setError(null);

      // Firebaseの実際のドキュメントIDを使用
      const scheduleId = editSchedule.firebaseId || editSchedule.id.toString();
      
      if (!scheduleId || scheduleId === '0') {
        throw new Error('スケジュールIDが無効です');
      }
      
      console.log('📅 スケジュール更新データ:', { 
        originalId: editSchedule.id, 
        scheduleId, 
        editSchedule 
      });
      
      const updateData = {
        title: editSchedule.title,
        description: editSchedule.description,
        engineerId: editSchedule.engineerId.toString(),
        engineerName: editSchedule.engineerName,
        startTime: new Date(editSchedule.startDate),
        endTime: new Date(editSchedule.endDate),
        status: editSchedule.status,
        location: editSchedule.location,
        updatedAt: new Date(),
      };

      // Firestoreのスケジュールを更新
      await updateSchedule(scheduleId, updateData);
      console.log('✅ スケジュールが更新されました');

      // スケジュール一覧を再取得
      const updatedFirestoreSchedules = await getSchedules();
      const updatedConvertedSchedules: Schedule[] = updatedFirestoreSchedules.map(firestoreSchedule => ({
        id: parseInt(firestoreSchedule.id) || 0,
        title: firestoreSchedule.title,
        description: firestoreSchedule.description,
          engineerId: firestoreSchedule.engineerId || '',
        engineerName: firestoreSchedule.engineerName || '',
        startDate: firestoreSchedule.startTime.toISOString(),
        endDate: firestoreSchedule.endTime.toISOString(),
        status: firestoreSchedule.status,
        priority: firestoreSchedule.priority || 'medium',
        workOrderId: parseInt(firestoreSchedule.workOrderId || '0') || 0,
        location: firestoreSchedule.location,
        customerName: '',
        customerPhone: '',
        firebaseId: firestoreSchedule.id
      }));
      
      setSchedulesList(updatedConvertedSchedules);
      setIsEditScheduleOpen(false);
      setEditSchedule(null);
    } catch (err) {
      console.error('❌ スケジュール更新エラー:', err);
      setError(`スケジュールの更新に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // ローディング状態
  if (loading && schedulesList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">スケジュールを読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* カレンダーコントロールバー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">スケジュール</h1>
          {/* 月次ナビゲーション */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-medium min-w-32 text-center">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* エンジニアフィルター */}
          {engineerFilter && filteredEngineer && (
            <Badge variant="secondary" className="gap-2">
              <User className="w-3 h-3" />
              {filteredEngineer.name}
              <Button variant="ghost" size="sm" className="h-auto p-0" onClick={clearFilter}>
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {/* 表示切り替え */}
          <div className="flex border rounded-lg">
            <Button 
              variant={view === 'month' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-r-none"
              onClick={() => setView('month')}
            >
              月間
            </Button>
            <Button 
              variant={view === 'week' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none border-x-0"
              onClick={() => setView('week')}
            >
              週間
            </Button>
            <Button 
              variant={view === 'day' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none border-x-0"
              onClick={() => setView('day')}
            >
              日間
            </Button>
          </div>
          
          <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新規スケジュール
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新規スケジュール</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {conflictAlert && (
                  <div className="flex items-center gap-2 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-800">{conflictAlert}</span>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                    placeholder="スケジュールタイトル"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">詳細</Label>
                  <Textarea
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
                    placeholder="スケジュール詳細"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="engineer">担当エンジニア</Label>
                    <Select value={newSchedule.engineerId} onValueChange={(value) => setNewSchedule({...newSchedule, engineerId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="エンジニアを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {firebaseEngineers.map(engineer => (
                          <SelectItem key={engineer.id} value={engineer.id.toString()}>
                            {engineer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">優先度</Label>
                    <Select value={newSchedule.priority} onValueChange={(value) => setNewSchedule({...newSchedule, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="urgent">緊急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">開始日</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newSchedule.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">終了日</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newSchedule.endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">開始時間</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">終了時間</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedDuration">予想時間（分）</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={newSchedule.estimatedDuration}
                      onChange={(e) => setNewSchedule({...newSchedule, estimatedDuration: e.target.value})}
                      placeholder="60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">場所</Label>
                    <Input
                      id="location"
                      value={newSchedule.location}
                      onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                      placeholder="作業場所"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">顧客名</Label>
                    <Input
                      id="customerName"
                      value={newSchedule.customerName}
                      onChange={(e) => setNewSchedule({...newSchedule, customerName: e.target.value})}
                      placeholder="顧客名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerPhone">顧客電話</Label>
                    <Input
                      id="customerPhone"
                      value={newSchedule.customerPhone}
                      onChange={(e) => setNewSchedule({...newSchedule, customerPhone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>
                
                {/* 推奨エンジニア表示 */}
                {recommendedEngineers.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      推奨エンジニア（{newSchedule.startDate} {newSchedule.startTime || '09:00'} - {newSchedule.endTime || '18:00'}）
                    </h4>
                    <div className="space-y-2">
                      {recommendedEngineers.map((engineer: Engineer) => (
                        <div key={engineer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium text-sm">{engineer.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {engineer.departmentId === 1 ? '技術部' : '保守部'}
                            </span>
                            {engineer.conflictCount > 0 && (
                              <span className="text-xs text-orange-600 ml-2">
                                （{engineer.conflictCount}件の予定あり）
                              </span>
                            )}
                          </div>
                          <Badge className={
                            engineer.availabilityStatus === 'available' ? 'bg-green-100 text-green-700' :
                            engineer.availabilityStatus === 'busy' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {engineer.availabilityStatus === 'available' ? '空きあり' :
                             engineer.availabilityStatus === 'busy' ? '稼働中' : '不明'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsNewScheduleOpen(false);
                  setConflictAlert(null);
                }}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateSchedule}>
                  作成
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* カレンダーメインエリア */}
      <Card className="overflow-hidden">
        
        {/* 月間表示 */}
        {view === 'month' && (
          <div className="p-0">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b">
              {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                <div key={day} className="p-4 text-center text-sm font-medium border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className="min-h-32 p-2 border-r border-b last-in-row:border-r-0 last-row:border-b-0 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    // 予定がある場合は詳細表示、ない場合は新規登録
                    if (day.schedules.length > 0) {
                      // 予定がある場合は最初の予定の詳細を表示
                      openScheduleDetails(day.schedules[0]);
                    } else {
                      // 予定がない場合は新規登録
                      openNewScheduleDialog(day);
                    }
                  }}
                >
                  {/* 日付番号 */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm ${
                      day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    } ${day.isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                      {day.date}
                    </span>
                    {day.schedules.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{day.schedules.length - 3}</span>
                    )}
                  </div>
                  
                  {/* スケジュールアイテム（最大3件表示） */}
                  <div className="space-y-1">
                    {day.schedules.slice(0, 3).map(schedule => (
                      <div 
                        key={schedule.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                          schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                          schedule.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                          schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openScheduleDetails(schedule);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {engineerFilter ? (
                            <span>{schedule.startTime} {schedule.title}</span>
                          ) : (
                            <span>{schedule.engineerName}: {schedule.title}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {day.schedules.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{day.schedules.length - 3}件
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 週間表示 */}
        {view === 'week' && (
          <div className="p-0">
            <div className="grid grid-cols-8 border-b">
              <div className="p-4 text-center text-sm font-medium border-r">
                エンジニア
              </div>
              {generateWeekData().map((dayData, index) => (
                <div key={index} className="p-4 text-center text-sm font-medium border-r last:border-r-0">
                  <div>{dayData.date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs text-muted-foreground">
                    {dayData.dayName}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-8">
              {firebaseEngineers.map((engineer) => (
                <React.Fragment key={engineer.id}>
                  <div className="p-4 border-r border-b bg-muted/30">
                    <div className="font-medium text-sm">{engineer.name}</div>
                    <div className="text-xs text-muted-foreground">{engineer.departmentId === 1 ? '技術部' : '保守部'}</div>
                  </div>
                  {generateWeekData().map((dayData, dateIndex) => (
                    <div 
                      key={dateIndex} 
                      className="p-2 border-r border-b last:border-r-0 min-h-20 cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        // その日のスケジュールを取得
                        const daySchedules = schedulesList.filter(schedule => {
                          const scheduleDate = new Date(schedule.startDate);
                          return scheduleDate.toDateString() === dayData.date.toDateString() && schedule.engineerId === engineer.id;
                        });
                        
                        if (daySchedules.length > 0) {
                          // 予定がある場合は最初の予定の詳細を表示
                          openScheduleDetails(daySchedules[0]);
                        } else {
                          // 予定がない場合は新規登録
                          openNewScheduleDialog({
                            date: dayData.date.getDate(),
                            isCurrentMonth: true,
                            isToday: dayData.isToday,
                            fullDate: dayData.date,
                            schedules: []
                          });
                        }
                      }}
                    >
                      {getSchedulesForDate(dayData.date).filter(schedule => schedule.engineerId === engineer.id).map((schedule) => (
                        <div 
                          key={schedule.id}
                          className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${
                            schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                            schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                          onClick={() => openScheduleDetails(schedule)}
                        >
                          <div className="truncate">{schedule.title}</div>
                          <div className="text-xs opacity-75">
                            {new Date(schedule.startDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 日間表示 */}
        {view === 'day' && (
          <div className="p-0">
            {/* 日付表示エリア */}
            <div className="p-4 bg-muted/30 border-b">
              <h3 className="text-lg font-semibold text-center">
                {currentDate.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
            </div>
            
            <div className="grid grid-cols-25 border-b">
              <div className="p-4 text-center text-sm font-medium border-r">
                エンジニア
              </div>
              {generateDayData().map((hour) => (
                <div key={hour} className="p-2 text-center text-xs font-medium border-r last:border-r-0">
                  {hour}:00
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-25">
              {firebaseEngineers.map((engineer) => (
                <React.Fragment key={engineer.id}>
                  <div className="p-4 border-r border-b bg-muted/30">
                    <div className="font-medium text-sm">{engineer.name}</div>
                    <div className="text-xs text-muted-foreground">{engineer.departmentId === 1 ? '技術部' : '保守部'}</div>
                  </div>
                  {generateDayData().map((hour) => (
                    <div 
                      key={hour} 
                      className="p-1 border-r border-b last:border-r-0 min-h-12 cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        const date = new Date(currentDate);
                        date.setHours(hour, 0, 0, 0);
                        
                        // その時間のスケジュールを取得
                        const hourSchedules = schedulesList.filter(schedule => {
                          const scheduleDate = new Date(schedule.startDate);
                          return scheduleDate.toDateString() === date.toDateString() && 
                                 schedule.engineerId === engineer.id &&
                                 scheduleDate.getHours() === hour;
                        });
                        
                        if (hourSchedules.length > 0) {
                          // 予定がある場合は最初の予定の詳細を表示
                          openScheduleDetails(hourSchedules[0]);
                        } else {
                          // 予定がない場合は新規登録
                          openNewScheduleDialog({
                            date: date.getDate(),
                            isCurrentMonth: true,
                            isToday: date.toDateString() === new Date().toDateString(),
                            fullDate: date,
                            schedules: []
                          });
                        }
                      }}
                    >
                      {getSchedulesForHour(currentDate, hour).filter(schedule => schedule.engineerId === engineer.id).map((schedule) => (
                        <div 
                          key={schedule.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                            schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                            schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                          onClick={() => openScheduleDetails(schedule)}
                        >
                          <div className="truncate">{schedule.title}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

      </Card>

      {/* 予定リスト表示 */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">予定一覧</h3>
          <div className="space-y-4">
            {schedulesList
              .filter(schedule => !engineerFilter || schedule.engineerId === engineerFilter)
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((schedule) => {
                const engineer = firebaseEngineers.find(e => e.id === schedule.engineerId);
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div>
                        <h3 className="font-medium">{schedule.title}</h3>
                        <p className="text-sm text-muted-foreground">{schedule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{engineer?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(schedule.startDate).toLocaleDateString('ja-JP')} 
                          {new Date(schedule.startDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge className={
                        schedule.status === 'completed' ? 'bg-green-100 text-green-700' :
                        schedule.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {schedule.status === 'completed' ? '完了' :
                         schedule.status === 'in_progress' ? '進行中' :
                         schedule.status === 'cancelled' ? 'キャンセル' :
                         '予定'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openScheduleDetails(schedule)}
                        >
                          詳細
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSchedule(schedule)}
                        >
                          編集
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>

      {/* スケジュール詳細表示ダイアログ */}
      <Dialog open={isScheduleDetailsOpen} onOpenChange={setIsScheduleDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>スケジュール詳細</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="detail-title">タイトル</Label>
                  <Input
                    id="detail-title"
                    value={selectedSchedule.title}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail-engineer">担当エンジニア</Label>
                  <Input
                    id="detail-engineer"
                    value={selectedSchedule.engineerName || firebaseEngineers.find(e => e.id === selectedSchedule.engineerId)?.name || ''}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="detail-description">詳細</Label>
                <Textarea
                  id="detail-description"
                  value={selectedSchedule.description}
                  readOnly
                  className="bg-gray-50"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="detail-start-time">開始時間</Label>
                  <Input
                    id="detail-start-time"
                    value={new Date(selectedSchedule.startDate).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail-end-time">終了時間</Label>
                  <Input
                    id="detail-end-time"
                    value={new Date(selectedSchedule.endDate).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="detail-duration">予想時間</Label>
                  <Input
                    id="detail-duration"
                    value={selectedSchedule.estimatedDuration ? `${selectedSchedule.estimatedDuration}分` : '未設定'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail-location">場所</Label>
                  <Input
                    id="detail-location"
                    value={selectedSchedule.location || '未設定'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="detail-customer-name">顧客名</Label>
                  <Input
                    id="detail-customer-name"
                    value={selectedSchedule.customerName || '未設定'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail-customer-phone">顧客電話</Label>
                  <Input
                    id="detail-customer-phone"
                    value={selectedSchedule.customerPhone || '未設定'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="detail-priority">優先度</Label>
                  <Input
                    id="detail-priority"
                    value={selectedSchedule.priority === 'urgent' ? '緊急' : 
                           selectedSchedule.priority === 'high' ? '高' :
                           selectedSchedule.priority === 'medium' ? '中' : '低'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail-status">ステータス</Label>
                  <Input
                    id="detail-status"
                    value={selectedSchedule.status === 'scheduled' ? '予定' :
                           selectedSchedule.status === 'in_progress' ? '進行中' :
                           selectedSchedule.status === 'completed' ? '完了' : 'キャンセル'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedSchedule) {
                  openEditSchedule(selectedSchedule);
                  setIsScheduleDetailsOpen(false);
                }
              }}
            >
              編集
            </Button>
            <Button onClick={() => setIsScheduleDetailsOpen(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* スケジュール編集ダイアログ */}
      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>スケジュール編集</DialogTitle>
          </DialogHeader>
          {editSchedule && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">タイトル</Label>
                  <Input
                    id="edit-title"
                    value={editSchedule.title}
                    onChange={(e) => setEditSchedule({...editSchedule, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-engineer">担当エンジニア</Label>
                  <Select
                    value={editSchedule.engineerId}
                    onValueChange={(value) => {
                      console.log('🔍 エンジニア選択:', { value, firebaseEngineers });
                      const engineer = firebaseEngineers.find(e => e.id === value);
                      console.log('🔍 見つかったエンジニア:', engineer);
                      setEditSchedule({
                        ...editSchedule,
                        engineerId: value, // 文字列IDをそのまま使用
                        engineerName: engineer?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="エンジニアを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {firebaseEngineers.map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">詳細</Label>
                <Textarea
                  id="edit-description"
                  value={editSchedule.description}
                  onChange={(e) => setEditSchedule({...editSchedule, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start-date">開始日</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editSchedule.startDate.split('T')[0]}
                    onChange={(e) => setEditSchedule({...editSchedule, startDate: e.target.value + 'T' + editSchedule.startDate.split('T')[1]})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end-date">終了日</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editSchedule.endDate.split('T')[0]}
                    onChange={(e) => setEditSchedule({...editSchedule, endDate: e.target.value + 'T' + editSchedule.endDate.split('T')[1]})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start-time">開始時間</Label>
                  <Input
                    id="edit-start-time"
                    type="time"
                    value={editSchedule.startDate.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => setEditSchedule({...editSchedule, startDate: editSchedule.startDate.split('T')[0] + 'T' + e.target.value + ':00.000Z'})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end-time">終了時間</Label>
                  <Input
                    id="edit-end-time"
                    type="time"
                    value={editSchedule.endDate.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => setEditSchedule({...editSchedule, endDate: editSchedule.endDate.split('T')[0] + 'T' + e.target.value + ':00.000Z'})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">場所</Label>
                  <Input
                    id="edit-location"
                    value={editSchedule.location || ''}
                    onChange={(e) => setEditSchedule({...editSchedule, location: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">ステータス</Label>
                  <Select
                    value={editSchedule.status}
                    onValueChange={(value) => setEditSchedule({...editSchedule, status: value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">予定</SelectItem>
                      <SelectItem value="in_progress">進行中</SelectItem>
                      <SelectItem value="completed">完了</SelectItem>
                      <SelectItem value="cancelled">キャンセル</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditScheduleOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateSchedule}>
              更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
