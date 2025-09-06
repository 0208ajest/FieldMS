'use client';

import { useState } from 'react';
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

interface NotificationSystemProps {
  onNavigateToSchedule?: (scheduleId: number, engineerId?: number) => void;
}

export default function NotificationSystem({ onNavigateToSchedule }: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // モック通知データ
  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'unassigned_schedule',
      title: '未割り当ての予定があります',
      description: 'システムメンテナンス作業 - エンジニアの割り当てが必要です',
      scheduleId: 101,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前
      read: false,
    },
    {
      id: 2,
      type: 'assigned_schedule',
      title: '新しい予定が割り当てられました',
      description: '緊急対応作業 - 明日の午前中に実施予定',
      scheduleId: 102,
      engineerId: 1,
      engineerName: '田中 太郎',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分前
      read: false,
    },
    {
      id: 3,
      type: 'unassigned_schedule',
      title: '未割り当ての予定があります',
      description: '定期点検作業 - 来週月曜日の実施予定',
      scheduleId: 103,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4時間前
      read: true,
    },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (onNavigateToSchedule) {
      onNavigateToSchedule(notification.scheduleId, notification.engineerId);
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
          {mockNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              通知はありません
            </div>
          ) : (
            mockNotifications.map((notification) => (
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
