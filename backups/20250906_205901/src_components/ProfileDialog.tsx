'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Edit, Save, X, Calendar, Briefcase, Award } from 'lucide-react';
import { User as UserType } from '@/types';

interface ProfileDialogProps {
  currentUser: UserType;
  onUpdateUser?: (updatedUser: UserType) => void;
}

export default function ProfileDialog({ currentUser, onUpdateUser }: ProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(currentUser);

  const handleSave = () => {
    if (onUpdateUser) {
      onUpdateUser(editedUser);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(currentUser);
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      system_admin: { label: 'システム管理者', className: 'bg-red-100 text-red-700 border-red-200' },
      admin: { label: '管理者', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      dispatcher: { label: 'ディスパッチャー', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      engineer_manager: { label: 'エンジニアマネージャー', className: 'bg-green-100 text-green-700 border-green-200' },
      engineer: { label: 'エンジニア', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.engineer;
    return <Badge className={roleInfo.className}>{roleInfo.label}</Badge>;
  };

  // モックデータ - 実際の実装ではAPIから取得
  const assignedProjects = [
    { id: 1, name: 'プロジェクトA', status: '進行中', progress: 75 },
    { id: 2, name: 'プロジェクトB', status: '完了', progress: 100 },
    { id: 3, name: 'プロジェクトC', status: '計画中', progress: 25 },
  ];

  const recentActivities = [
    { id: 1, action: 'スケジュール更新', target: 'プロジェクトA', time: '2時間前' },
    { id: 2, action: '作業指示完了', target: 'プロジェクトB', time: '1日前' },
    { id: 3, action: '新規案件割り当て', target: 'プロジェクトC', time: '3日前' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-8 h-8 bg-primary rounded-full p-0 hover:bg-primary/90">
          <span className="text-sm text-primary-foreground font-medium">
            {currentUser?.name?.[0] || 'U'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            プロフィール
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* プロフィール基本情報 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">基本情報</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    編集
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      キャンセル
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={editedUser.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {editedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="name">名前</Label>
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">メール</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold">{editedUser.name}</h3>
                      <p className="text-muted-foreground">{editedUser.email}</p>
                      <div className="mt-2">
                        {getRoleBadge(editedUser.systemRole)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {isEditing && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">部門</Label>
                    <Select 
                      value={editedUser.departmentId?.toString() || ''} 
                      onValueChange={(value) => setEditedUser({...editedUser, departmentId: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="部門を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">技術部</SelectItem>
                        <SelectItem value="2">保守部</SelectItem>
                        <SelectItem value="3">営業部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {isEditing && (
                <div>
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={editedUser.bio || ''}
                    onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                    placeholder="自己紹介を入力してください"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 割り当て案件カード */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                割り当て案件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{project.progress}%</p>
                      <div className="w-20 h-2 bg-muted rounded-full mt-1">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近のアクティビティ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                最近のアクティビティ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.target}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 権限情報 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5" />
                権限情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">システムロール</span>
                  {getRoleBadge(editedUser.systemRole)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">アクセスレベル</span>
                  <Badge variant="outline">
                    {editedUser.systemRole === 'system_admin' ? 'フルアクセス' :
                     editedUser.systemRole === 'admin' ? '管理アクセス' :
                     editedUser.systemRole === 'dispatcher' ? 'ディスパッチアクセス' :
                     editedUser.systemRole === 'engineer_manager' ? 'エンジニア管理アクセス' :
                     '基本アクセス'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
