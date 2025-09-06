'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, X, User, AlertTriangle } from 'lucide-react';
import { User as UserType, Schedule, WorkOrder } from '@/types';
import { schedules, engineers, workOrders } from '@/components/data/engineerData';

interface ScheduleCalendarProps {
  currentUser: UserType;
  engineerFilter?: number | null;
}

export default function ScheduleCalendar({ currentUser: _currentUser, engineerFilter }: ScheduleCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [schedulesList, setSchedulesList] = useState(schedules);
  const [workOrdersList, setWorkOrdersList] = useState(workOrders);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

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

  // 現在の月のカレンダーデータを生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
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
          engineerName: engineers.find(e => e.id === schedule.engineerId)?.name || '不明',
          startTime: new Date(schedule.startDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        }))
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // スケジュール重複チェック
  const checkScheduleConflict = (engineerId: number, startDateTime: Date, endDateTime: Date) => {
    const conflicts = schedulesList.filter(schedule => {
      if (schedule.engineerId !== engineerId) return false;
      
      const existingStart = new Date(schedule.startDate);
      const existingEnd = new Date(schedule.endDate);
      
      return (startDateTime < existingEnd && endDateTime > existingStart);
    });
    
    return conflicts;
  };

  // 新規スケジュール作成
  const handleCreateSchedule = () => {
    if (!newSchedule.engineerId || !newSchedule.startDate || !newSchedule.startTime) {
      setConflictAlert('必須項目を入力してください');
      return;
    }

    const startDateTime = new Date(`${newSchedule.startDate}T${newSchedule.startTime}`);
    const endDateTime = new Date(`${newSchedule.endDate || newSchedule.startDate}T${newSchedule.endTime || newSchedule.startTime}`);
    
    const conflicts = checkScheduleConflict(parseInt(newSchedule.engineerId), startDateTime, endDateTime);
    
    if (conflicts.length > 0) {
      const engineerName = engineers.find(e => e.id === parseInt(newSchedule.engineerId))?.name;
      setConflictAlert(`${engineerName}エンジニアのスケジュールが重複しています。時間を調整してください。`);
      return;
    }

    // 作業指示を作成
    const workOrder: WorkOrder = {
      id: workOrdersList.length + 1,
      title: newSchedule.title,
      description: newSchedule.description,
      location: newSchedule.location,
      priority: newSchedule.priority as 'low' | 'medium' | 'high' | 'urgent',
      estimatedDuration: parseInt(newSchedule.estimatedDuration) || 60,
      dueDate: endDateTime,
      status: 'pending',
      assignedEngineerId: parseInt(newSchedule.engineerId),
      progress: 0,
      createdAt: new Date(),
      completedAt: null
    };

    // スケジュールを作成
    const schedule: Schedule = {
      id: schedulesList.length + 1,
      title: newSchedule.title,
      description: newSchedule.description,
      engineerId: parseInt(newSchedule.engineerId),
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      status: newSchedule.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
      priority: newSchedule.priority as 'low' | 'medium' | 'high' | 'urgent',
      workOrderId: workOrder.id
    };

    // 作業指示とスケジュールを同時に追加
    setWorkOrdersList([...workOrdersList, workOrder]);
    setSchedulesList([...schedulesList, schedule]);
    setIsNewScheduleOpen(false);
    setConflictAlert(null);
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
  };

  const calendarDays = generateCalendarDays();
  const filteredEngineer = engineerFilter ? engineers.find(e => e.id === engineerFilter) : null;

  // 週間表示用のデータ生成
  const generateWeekData = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    
    return weekDays;
  };

  // 日間表示用のデータ生成（24時間）
  const generateDayData = () => {
    const hours = [];
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
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
  };

  const openScheduleDetails = (schedule: Schedule) => {
    console.log('スケジュール詳細:', schedule);
  };

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
                        {engineers.map(engineer => (
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
                      onChange={(e) => setNewSchedule({...newSchedule, startDate: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">終了日</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newSchedule.endDate}
                      onChange={(e) => setNewSchedule({...newSchedule, endDate: e.target.value})}
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
                      onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">終了時間</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
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
                  onClick={() => openNewScheduleDialog(day)}
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
              {generateWeekData().map((date, index) => (
                <div key={index} className="p-4 text-center text-sm font-medium border-r last:border-r-0">
                  <div>{date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('ja-JP', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-8">
              {engineers.map((engineer) => (
                <React.Fragment key={engineer.id}>
                  <div className="p-4 border-r border-b bg-muted/30">
                    <div className="font-medium text-sm">{engineer.name}</div>
                    <div className="text-xs text-muted-foreground">{engineer.departmentId === 1 ? '技術部' : '保守部'}</div>
                  </div>
                  {generateWeekData().map((date, dateIndex) => (
                    <div 
                      key={dateIndex} 
                      className="p-2 border-r border-b last:border-r-0 min-h-20 cursor-pointer hover:bg-muted/30"
                      onClick={() => openNewScheduleDialog({
                        date: date.getDate(),
                        isCurrentMonth: true,
                        isToday: date.toDateString() === new Date().toDateString(),
                        fullDate: date,
                        schedules: []
                      })}
                    >
                      {getSchedulesForDate(date).filter(schedule => schedule.engineerId === engineer.id).map((schedule) => (
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
              {engineers.map((engineer) => (
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
                        openNewScheduleDialog({
                          date: date.getDate(),
                          isCurrentMonth: true,
                          isToday: date.toDateString() === new Date().toDateString(),
                          fullDate: date,
                          schedules: []
                        });
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
                const engineer = engineers.find(e => e.id === schedule.engineerId);
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
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>
    </div>
  );
}
