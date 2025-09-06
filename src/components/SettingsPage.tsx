'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Monitor, Bell, Globe, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    schedule: true,
    workOrder: true,
    system: false,
  });
  const [language, setLanguage] = useState('ja');
  const [timezone, setTimezone] = useState('Asia/Tokyo');

  useEffect(() => {
    // テーマの適用
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // システム設定に従う
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('timezone', newTimezone);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
      </div>

      <div className="grid gap-6">
        {/* 外観設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              外観
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>テーマ</Label>
                <p className="text-sm text-muted-foreground">
                  アプリケーションの外観を設定します
                </p>
              </div>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      ライト
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      ダーク
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      システム
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              通知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>メール通知</Label>
                  <p className="text-sm text-muted-foreground">
                    重要な更新をメールで受け取ります
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>プッシュ通知</Label>
                  <p className="text-sm text-muted-foreground">
                    ブラウザのプッシュ通知を受け取ります
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>スケジュール通知</Label>
                  <p className="text-sm text-muted-foreground">
                    スケジュールの変更や更新を通知します
                  </p>
                </div>
                <Switch
                  checked={notifications.schedule}
                  onCheckedChange={(checked) => handleNotificationChange('schedule', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>作業指示通知</Label>
                  <p className="text-sm text-muted-foreground">
                    新しい作業指示や更新を通知します
                  </p>
                </div>
                <Switch
                  checked={notifications.workOrder}
                  onCheckedChange={(checked) => handleNotificationChange('workOrder', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>システム通知</Label>
                  <p className="text-sm text-muted-foreground">
                    システムメンテナンスや重要な更新を通知します
                  </p>
                </div>
                <Switch
                  checked={notifications.system}
                  onCheckedChange={(checked) => handleNotificationChange('system', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 地域・言語設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              地域・言語
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>言語</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>タイムゾーン</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tokyo">東京 (UTC+9)</SelectItem>
                    <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    <SelectItem value="America/New_York">ニューヨーク (UTC-5)</SelectItem>
                    <SelectItem value="Europe/London">ロンドン (UTC+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* セキュリティ設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              セキュリティ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>セッション管理</Label>
                  <p className="text-sm text-muted-foreground">
                    現在のセッション情報を表示します
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  セッション管理
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>パスワード変更</Label>
                  <p className="text-sm text-muted-foreground">
                    アカウントのパスワードを変更します
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  パスワード変更
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* データ管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              データ管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>データエクスポート</Label>
                  <p className="text-sm text-muted-foreground">
                    アカウントデータをエクスポートします
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  エクスポート
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>キャッシュクリア</Label>
                  <p className="text-sm text-muted-foreground">
                    アプリケーションのキャッシュをクリアします
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  クリア
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アプリケーション情報 */}
        <Card>
          <CardHeader>
            <CardTitle>アプリケーション情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">バージョン</span>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">ビルド日時</span>
              <span className="text-sm text-muted-foreground">2024-12-XX</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">環境</span>
              <Badge variant="outline">開発環境</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
