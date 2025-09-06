'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, X, User } from 'lucide-react';
import { User as UserType } from '@/types';
import { schedules, engineers } from '@/components/data/engineerData';

interface ScheduleCalendarProps {
  currentUser: UserType;
  engineerFilter?: number | null;
}

export default function ScheduleCalendar({ currentUser: _currentUser, engineerFilter }: ScheduleCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

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
      const daySchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.startDate);
        return scheduleDate.toDateString() === current.toDateString() &&
               (!engineerFilter || schedule.engineerId === engineerFilter);
      });
      
      days.push({
        date: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
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

  const calendarDays = generateCalendarDays();
  const filteredEngineer = engineerFilter ? engineers.find(e => e.id === engineerFilter) : null;

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const clearFilter = () => {
    // 親コンポーネントにフィルタークリアを通知
    window.location.reload(); // 簡易実装
  };

  const openNewScheduleDialog = (day: { date: number; isCurrentMonth: boolean; isToday: boolean; schedules: Array<{ id: number; title: string; engineerName: string; startTime: string; status: string }> }) => {
    console.log('新規スケジュール作成:', day);
  };

  const openScheduleDetails = (schedule: { id: number; title: string; engineerName: string; startTime: string; status: string }) => {
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
              className="rounded-l-none"
              onClick={() => setView('day')}
            >
              日間
            </Button>
          </div>
          
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            新規スケジュール
          </Button>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 週間表示 */}
        {view === 'week' && (
          <div className="p-6">
            <div className="text-center text-muted-foreground">
              週間表示は実装予定です
            </div>
          </div>
        )}

        {/* 日間表示 */}
        {view === 'day' && (
          <div className="p-6">
            <div className="text-center text-muted-foreground">
              日間表示は実装予定です
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
