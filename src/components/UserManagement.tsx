'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '@/types';
import { users, companies, departments } from '@/components/data/userData';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState(users);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    systemRole: 'engineer',
    companyId: 1,
    departmentId: 1,
    isActive: true
  });

  // フィルタリングされたユーザーリスト
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.systemRole === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ユーザー追加
  const handleAddUser = () => {
    const user: User = {
      id: usersList.length + 1,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      systemRole: newUser.systemRole as 'system_admin' | 'admin' | 'dispatcher' | 'engineer_manager' | 'engineer',
      companyId: newUser.companyId,
      departmentId: newUser.departmentId,
      isActive: newUser.isActive,
      avatar: '',
      createdAt: new Date(),
      lastLoginAt: null
    };

    setUsersList([...usersList, user]);
    setIsAddUserOpen(false);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      systemRole: 'engineer',
      companyId: 1,
      departmentId: 1,
      isActive: true
    });
  };

  // ユーザー削除
  const handleDeleteUser = (userId: number) => {
    setUsersList(usersList.filter(u => u.id !== userId));
  };

  // ユーザー詳細表示
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewUserOpen(true);
  };

  // ユーザー編集
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    // 編集機能は今後実装予定
    console.log('ユーザー編集:', user);
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      system_admin: { label: 'システム管理者', className: 'bg-red-100 text-red-700 border-red-200' },
      admin: { label: '管理者', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      dispatcher: { label: 'ディスパッチャー', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      engineer_manager: { label: 'エンジニア管理', className: 'bg-green-100 text-green-700 border-green-200' },
      engineer: { label: 'エンジニア', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.engineer;
    return <Badge className={roleInfo.className}>{roleInfo.label}</Badge>;
  };

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || '不明';
  };

  const getDepartmentName = (departmentId: number) => {
    return departments.find(d => d.id === departmentId)?.name || '不明';
  };


  return (
    <div className="space-y-6">
      {/* ページヘッダー + アクション */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ユーザー管理</h1>
          <p className="text-muted-foreground">ユーザーの登録・編集・権限管理</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                ユーザー追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>ユーザー追加</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="ユーザー名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">メール</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">権限</Label>
                    <Select value={newUser.systemRole} onValueChange={(value) => setNewUser({...newUser, systemRole: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineer">エンジニア</SelectItem>
                        <SelectItem value="engineer_manager">エンジニア管理</SelectItem>
                        <SelectItem value="dispatcher">ディスパッチャー</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                        <SelectItem value="system_admin">システム管理者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company">会社</Label>
                    <Select value={newUser.companyId.toString()} onValueChange={(value) => setNewUser({...newUser, companyId: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">部門</Label>
                    <Select value={newUser.departmentId.toString()} onValueChange={(value) => setNewUser({...newUser, departmentId: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddUser}>
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* フィルター・検索バー */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 検索入力 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="名前、メールで検索..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* 権限フィルター */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="権限を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての権限</SelectItem>
              <SelectItem value="system_admin">システム管理者</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
              <SelectItem value="dispatcher">ディスパッチャー</SelectItem>
              <SelectItem value="engineer_manager">エンジニア管理</SelectItem>
              <SelectItem value="engineer">エンジニア</SelectItem>
            </SelectContent>
          </Select>

          {/* ステータスフィルター */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">有効</SelectItem>
              <SelectItem value="inactive">無効</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ユーザーテーブル */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-64">ユーザー</TableHead>
              <TableHead className="w-48">連絡先</TableHead>
              <TableHead className="w-32">権限</TableHead>
              <TableHead className="w-32">組織</TableHead>
              <TableHead className="w-24">ステータス</TableHead>
              <TableHead className="w-32 text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* アバター */}
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone || '未設定'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.systemRole)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{getCompanyName(user.companyId)}</p>
                    <p className="text-xs text-muted-foreground">{getDepartmentName(user.departmentId)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                    {user.isActive ? '有効' : '無効'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {user.id !== currentUser.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* ページネーション */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredUsers.length}人中 1-{Math.min(filteredUsers.length, 10)}人を表示
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 組織管理セクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 会社管理 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">会社管理</h3>
            <div className="space-y-3">
              {companies.map(company => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.address}</p>
                  </div>
                  <Badge className={company.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {company.isActive ? '有効' : '無効'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              会社追加
            </Button>
          </div>
        </Card>

        {/* 部門管理 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">部門管理</h3>
            <div className="space-y-3">
              {departments.map(department => (
                <div key={department.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{department.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getCompanyName(department.companyId)}
                    </p>
                  </div>
                  <Badge className={department.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {department.isActive ? '有効' : '無効'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              部門追加
            </Button>
          </div>
        </Card>
      </div>

      {/* ユーザー詳細表示ダイアログ */}
      <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ユーザー詳細</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
                  {getRoleBadge(selectedUser.systemRole)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">メール</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">電話</Label>
                  <p className="text-sm">{selectedUser.phone || '未設定'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">会社</Label>
                  <p className="text-sm">{getCompanyName(selectedUser.companyId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">部門</Label>
                  <p className="text-sm">{getDepartmentName(selectedUser.departmentId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ステータス</Label>
                  <Badge className={selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {selectedUser.isActive ? '有効' : '無効'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">最終ログイン</Label>
                  <p className="text-sm">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('ja-JP') : '未ログイン'}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewUserOpen(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

