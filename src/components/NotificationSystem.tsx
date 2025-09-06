'use client';

import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Notification {
  id: number;
  type: 'system' | 'schedule' | 'work_order' | 'alert';
  title: string;
  description?: string;
  createdAt: Date;
  read: boolean;
  scheduleId?: number;
  engineerId?: number;
}

interface NotificationSystemProps {
  onNavigateToSchedule?: (engineerId?: number) => void;
}

export default function NotificationSystem({ onNavigateToSchedule }: NotificationSystemProps) {
  const mock: Notification[] = [
    { 
      id: 1, 
      type: 'work_order', 
      title: '新規作業指示 #5001', 
      description: '緊急対応が必要です',
      createdAt: new Date(), 
      read: false 
    },
    { 
      id: 2, 
      type: 'schedule', 
      title: 'スケジュール更新: 田中 太郎', 
      description: '明日のスケジュールが変更されました',
      createdAt: new Date(), 
      read: false,
      scheduleId: 1,
      engineerId: 1
    },
    { 
      id: 3, 
      type: 'system', 
      title: 'メンテナンス予定: 今夜1:00', 
      description: 'システムメンテナンスのため一時的にサービスが停止します',
      createdAt: new Date(), 
      read: true 
    },
    { 
      id: 4, 
      type: 'alert', 
      title: 'スケジュール重複警告', 
      description: '佐藤 花子のスケジュールが重複しています',
      createdAt: new Date(), 
      read: false,
      scheduleId: 2,
      engineerId: 2
    },
  ];

  const unread = mock.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'schedule' || notification.type === 'alert') {
      if (notification.engineerId && onNavigateToSchedule) {
        onNavigateToSchedule(notification.engineerId);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 h-5 min-w-5 flex items-center justify-center bg-primary text-primary-foreground">
              {unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>通知</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mock.map((n) => (
          <DropdownMenuItem 
            key={n.id} 
            className="flex flex-col items-start gap-1 cursor-pointer"
            onClick={() => handleNotificationClick(n)}
          >
            <div className="flex items-center gap-2 w-full">
              <span className={`w-2 h-2 rounded-full ${n.read ? 'bg-muted' : 'bg-primary'}`} />
              <span className="text-sm font-medium truncate">{n.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {n.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {n.description && (
              <span className="text-xs text-muted-foreground line-clamp-2">
                {n.description}
              </span>
            )}
            {(n.type === 'schedule' || n.type === 'alert') && (
              <span className="text-xs text-primary">
                クリックしてスケジュールを表示
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



