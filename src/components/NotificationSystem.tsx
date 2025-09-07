'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Notification } from '@/types';
import { getWorkOrders, getSchedules } from '@/lib/firestore';

interface NotificationSystemProps {
  onNavigateToDispatch?: () => void;
  onNavigateToSchedule?: (scheduleId: number, engineerId?: number) => void;
}

export default function NotificationSystem({ onNavigateToDispatch, onNavigateToSchedule }: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 実際のデータから通知を生成
  useEffect(() => {
    const generateNotifications = async () => {
      try {
        setLoading(true);
        const [workOrders, schedules] = await Promise.all([
          getWorkOrders(),
          getSchedules()
        ]);

        const generatedNotifications: Notification[] = [];

        // 未割り当ての作業指示から通知を生成
        const unassignedWorkOrders = workOrders.filter(wo => wo.status === 'pending');
        unassignedWorkOrders.forEach((workOrder, index) => {
          generatedNotifications.push({
            id: `unassigned-${workOrder.id}`,
            type: 'unassigned_schedule',
            title: '未割り当ての予定があります',
            description: `${workOrder.title} - エンジニアの割り当てが必要です`,
            scheduleId: workOrder.id, // 文字列IDをそのまま使用
            createdAt: workOrder.createdAt,
            read: false,
          });
        });

        // 最近割り当てられたスケジュールから通知を生成
        const recentAssignedSchedules = schedules
          .filter(s => s.status === 'scheduled' && s.engineerId)
          .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
          .slice(0, 3);

        recentAssignedSchedules.forEach((schedule, index) => {
          generatedNotifications.push({
            id: `assigned-${schedule.id}`,
            type: 'assigned_schedule',
            title: '新しい予定が割り当てられました',
            description: `${schedule.title} - ${schedule.engineerName || 'エンジニア'}に割り当て`,
            scheduleId: schedule.id, // 文字列IDをそのまま使用
            engineerId: schedule.engineerId,
            engineerName: schedule.engineerName,
            createdAt: schedule.createdAt || new Date(),
            read: false,
          });
        });

        // 緊急作業指示から通知を生成
        const urgentWorkOrders = workOrders.filter(wo => wo.priority === 'urgent' && wo.status !== 'completed');
        urgentWorkOrders.forEach((workOrder, index) => {
          generatedNotifications.push({
            id: `urgent-${workOrder.id}`,
            type: 'unassigned_schedule',
            title: '緊急作業指示があります',
            description: `${workOrder.title} - 緊急対応が必要です`,
            scheduleId: workOrder.id, // 文字列IDをそのまま使用
            createdAt: workOrder.createdAt,
            read: false,
          });
        });

        // 作成日時でソート（新しい順）
        generatedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setNotifications(generatedNotifications);
      } catch (error) {
        console.error('通知生成エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    generateNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // 通知を既読にする
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // 通知タイプに応じて適切な画面に遷移
    if (notification.type === 'unassigned_schedule') {
      // 未割り当ての予定はディスパッチ画面に遷移
      if (onNavigateToDispatch) {
        onNavigateToDispatch();
      }
    } else if (notification.type === 'assigned_schedule') {
      // 割り当て済みの予定はスケジュール画面に遷移
      if (onNavigateToSchedule) {
        onNavigateToSchedule(notification.scheduleId, notification.engineerId);
      }
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'unassigned_schedule':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'assigned_schedule':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'unassigned_schedule':
        return '未割り当て';
      case 'assigned_schedule':
        return '割り当て済み';
      default:
        return '通知';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-accent">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 h-5 min-w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知
          </SheetTitle>
          <SheetDescription className="flex items-center justify-between">
            <span>システムからの通知一覧です</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}件の未読
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-muted-foreground">読み込み中...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>通知はありません</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                      <Badge 
                        variant={notification.type === 'unassigned_schedule' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {notification.createdAt.toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-primary">
                        クリックして詳細を表示
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
