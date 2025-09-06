'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clipboard, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('メールアドレスまたはパスワードが正しくありません');
      }
  } catch (_err) {
    setError('ログインに失敗しました。再度お試しください。');
  } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <Clipboard className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">FieldMS</h1>
          <p className="text-muted-foreground">フィールドマネジメントシステム</p>
        </div>

        <Card className="p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-4 bg-accent/50">
          <h3 className="text-sm font-medium mb-2">デモアカウント</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>システム管理者: admin@fieldms.com / admin123</p>
            <p>管理者: manager@fieldms.com / manager123</p>
            <p>ディスパッチャー: dispatcher@fieldms.com / dispatch123</p>
            <p>エンジニア管理: engineer.manager@fieldms.com / engmgr123</p>
            <p>エンジニア: engineer@fieldms.com / eng123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}


