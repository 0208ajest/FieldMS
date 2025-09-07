'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Eye, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { User, FirestoreUser } from '@/types';
import { users, companies, departments } from '@/components/data/userData';
import { getUsers, addUser, updateUser, deleteUser, getCompanies, addCompany, updateCompany, deleteCompany } from '@/lib/firestore';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'companies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 会社管理用のstate
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isDeleteCompanyConfirmOpen, setIsDeleteCompanyConfirmOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<any>(null);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    systemRole: 'engineer',
    companyId: 1,
    departmentId: 1,
    isActive: true
  });

  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    systemRole: 'engineer' as 'system_admin' | 'admin' | 'dispatcher' | 'engineer_manager' | 'engineer',
    companyId: 1,
    departmentId: 1,
    isActive: true
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });

  const [editCompany, setEditCompany] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });

  // Firestoreからユーザー一覧を取得
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const firestoreUsers = await getUsers();
        
        // FirestoreUserをUser型に変換
        const convertedUsers: User[] = firestoreUsers.map((firestoreUser: any) => ({
          id: firestoreUser.id,
          name: firestoreUser.name || '',
          email: firestoreUser.email || '',
          phone: firestoreUser.phone || '',
          systemRole: firestoreUser.systemRole || 'engineer',
          companyId: parseInt(firestoreUser.companyId) || 1,
          departmentId: parseInt(firestoreUser.departmentId) || 1,
          isActive: firestoreUser.isActive !== false,
          avatar: firestoreUser.avatar || '',
          bio: firestoreUser.bio || '',
          createdAt: firestoreUser.createdAt || new Date(),
          lastLoginAt: firestoreUser.lastLoginAt || undefined,
        }));
        
        setUsersList(convertedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('ユーザー一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Firestoreから会社一覧を取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompanyLoading(true);
        const companies = await getCompanies();
        setCompaniesList(companies as any[]);
      } catch (err) {
        console.error('会社一覧取得エラー:', err);
      } finally {
        setCompanyLoading(false);
      }
    };

    if (activeTab === 'companies') {
      fetchCompanies();
    }
  }, [activeTab]);

  // フィルタリングされたユーザーリスト
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.systemRole === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ユーザー追加
  const handleAddUser = async () => {
    try {
      setLoading(true);
      
      const userDataWithoutId = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        systemRole: newUser.systemRole as 'system_admin' | 'admin' | 'dispatcher' | 'engineer_manager' | 'engineer',
        companyId: newUser.companyId.toString(),
        departmentId: newUser.departmentId.toString(),
        isActive: newUser.isActive,
        avatar: '',
        bio: '',
        createdAt: new Date(),
        lastLoginAt: null,
      };

      const newUserId = await addUser(userDataWithoutId as any);
      
      // 更新されたユーザー一覧を取得
      const updatedFirestoreUsers = await getUsers();
      const updatedConvertedUsers: User[] = updatedFirestoreUsers.map((firestoreUser: any) => ({
        id: firestoreUser.id,
        name: firestoreUser.name || '',
        email: firestoreUser.email || '',
        phone: firestoreUser.phone || '',
        systemRole: firestoreUser.systemRole || 'engineer',
        companyId: parseInt(firestoreUser.companyId) || 1,
        departmentId: parseInt(firestoreUser.departmentId) || 1,
        isActive: firestoreUser.isActive !== false,
        avatar: firestoreUser.avatar || '',
        bio: firestoreUser.bio || '',
        createdAt: firestoreUser.createdAt || new Date(),
        lastLoginAt: firestoreUser.lastLoginAt || undefined,
      }));
      
      setUsersList(updatedConvertedUsers);
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
    } catch (err) {
      console.error('Error adding user:', err);
      setError('ユーザーの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 会社管理用の関数
  const handleAddCompany = async () => {
    try {
      const companyId = await addCompany(newCompany);
      const newCompanyWithId = { id: companyId, ...newCompany };
      setCompaniesList(prev => [...prev, newCompanyWithId]);
      setIsAddCompanyOpen(false);
      setNewCompany({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
      });
    } catch (error) {
      console.error('会社追加エラー:', error);
    }
  };

  const handleEditCompany = async () => {
    if (!companyToEdit) return;

    try {
      await updateCompany(companyToEdit.id, editCompany);
      setCompaniesList(prev => prev.map(company => 
        company.id === companyToEdit.id ? { ...company, ...editCompany } : company
      ));
      setIsEditCompanyOpen(false);
      setCompanyToEdit(null);
    } catch (error) {
      console.error('会社更新エラー:', error);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      await deleteCompany(companyToDelete.id);
      setCompaniesList(prev => prev.filter(company => company.id !== companyToDelete.id));
      setIsDeleteCompanyConfirmOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('会社削除エラー:', error);
    }
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
    // まずFirebaseの会社データから検索
    const firebaseCompany = companiesList.find(c => c.id === companyId.toString());
    if (firebaseCompany) {
      return firebaseCompany.name;
    }
    // フォールバックとしてモックデータから検索
    return companies.find(c => c.id === companyId)?.name || '不明';
  };

  const getDepartmentName = (departmentId: number) => {
    return departments.find(d => d.id === departmentId)?.name || '不明';
  };

  // ユーザー編集の実行
  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    
    try {
      setLoading(true);
      
      const updateData = {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        systemRole: editUser.systemRole,
        companyId: editUser.companyId.toString(),
        departmentId: editUser.departmentId.toString(),
        isActive: editUser.isActive
      };
      
      await updateUser(userToEdit.id, updateData);
      
      setUsersList(usersList.map(u => 
        u.id === userToEdit.id 
          ? { ...u, ...editUser }
          : u
      ));
      
      setIsEditUserOpen(false);
      setUserToEdit(null);
    } catch (err) {
      console.error('ユーザー更新エラー:', err);
      setError('ユーザーの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザー削除の実行
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await deleteUser(userToDelete.id);
      setUsersList(usersList.filter(u => u.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      setError('ユーザーの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 削除をキャンセル
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  // 編集をキャンセル
  const handleEditCancel = () => {
    setIsEditUserOpen(false);
    setUserToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setError(null)}
          >
            閉じる
          </Button>
        </Card>
      )}

      {/* ページヘッダー + アクション */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ユーザー管理</h1>
          <p className="text-muted-foreground">ユーザーと会社の管理</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <Dialog open={isAddUserOpen} onOpenChange={async (open) => {
              setIsAddUserOpen(open);
              // ダイアログを開く際に会社データを取得
              if (open && companiesList.length === 0) {
                try {
                  const companies = await getCompanies();
                  setCompaniesList(companies as any[]);
                } catch (err) {
                  console.error('会社データ取得エラー:', err);
                }
              }
            }}>
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
                      <Label htmlFor="company">所属会社</Label>
                      <Select value={newUser.companyId.toString()} onValueChange={(value) => setNewUser({...newUser, companyId: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue placeholder="会社を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {companiesList.length > 0 ? (
                            companiesList.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              会社データを読み込み中...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="department">所属部門</Label>
                      <Select value={newUser.departmentId.toString()} onValueChange={(value) => setNewUser({...newUser, departmentId: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue placeholder="部門を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="active" 
                      checked={newUser.isActive}
                      onCheckedChange={(checked) => setNewUser({...newUser, isActive: checked as boolean})}
                    />
                    <Label htmlFor="active">アクティブ</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddUser} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        追加中...
                      </>
                    ) : (
                      '追加'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === 'companies' && (
            <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  会社追加
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>会社追加</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company-name">会社名 *</Label>
                    <Input
                      id="company-name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      placeholder="会社名を入力"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-address">住所</Label>
                    <Input
                      id="company-address"
                      value={newCompany.address}
                      onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                      placeholder="住所を入力"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company-phone">電話番号</Label>
                      <Input
                        id="company-phone"
                        value={newCompany.phone}
                        onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                        placeholder="電話番号を入力"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company-email">メール</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={newCompany.email}
                        onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                        placeholder="メールアドレスを入力"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-description">説明</Label>
                    <Textarea
                      id="company-description"
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                      placeholder="会社の説明を入力"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddCompany} disabled={companyLoading}>
                    {companyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        追加中...
                      </>
                    ) : (
                      '追加'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          ユーザー管理
        </Button>
        <Button
          variant={activeTab === 'companies' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('companies')}
        >
          会社管理
        </Button>
      </div>

      {/* フィルター・検索バー */}
      {activeTab === 'users' && (
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
            {/* フィルター */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="権限" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="system_admin">システム管理者</SelectItem>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="dispatcher">ディスパッチャー</SelectItem>
                <SelectItem value="engineer_manager">エンジニア管理</SelectItem>
                <SelectItem value="engineer">エンジニア</SelectItem>
              </SelectContent>
            </Select>
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
      )}

      {/* 会社管理UI */}
      {activeTab === 'companies' && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">会社一覧</h3>
            {companyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>読み込み中...</span>
              </div>
            ) : companiesList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>登録された会社がありません</p>
                <p className="text-sm">「会社追加」ボタンから会社を追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companiesList.map((company) => (
                  <div key={company.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{company.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                          {company.address && (
                            <div>
                              <span className="font-medium">住所:</span> {company.address}
                            </div>
                          )}
                          {company.phone && (
                            <div>
                              <span className="font-medium">電話:</span> {company.phone}
                            </div>
                          )}
                          {company.email && (
                            <div>
                              <span className="font-medium">メール:</span> {company.email}
                            </div>
                          )}
                          {company.description && (
                            <div className="col-span-2">
                              <span className="font-medium">説明:</span> {company.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCompanyToEdit(company);
                            setEditCompany({
                              name: company.name,
                              address: company.address || '',
                              phone: company.phone || '',
                              email: company.email || '',
                              description: company.description || ''
                            });
                            setIsEditCompanyOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCompanyToDelete(company);
                            setIsDeleteCompanyConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ユーザーテーブル */}
      {activeTab === 'users' && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">ユーザー一覧</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>ユーザー</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>所属</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>最終ログイン</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>読み込み中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    条件に一致するユーザーが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.systemRole)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{getCompanyName(user.companyId)}</div>
                        <div className="text-muted-foreground">{getDepartmentName(user.departmentId)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {user.isActive ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP') : 'なし'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // 会社データが読み込まれていない場合は取得
                            if (companiesList.length === 0) {
                              try {
                                const companies = await getCompanies();
                                setCompaniesList(companies as any[]);
                              } catch (err) {
                                console.error('会社データ取得エラー:', err);
                              }
                            }
                            
                            setUserToEdit(user);
                            setEditUser({
                              name: user.name,
                              email: user.email,
                              phone: user.phone || '',
                              systemRole: user.systemRole,
                              companyId: user.companyId,
                              departmentId: user.departmentId,
                              isActive: user.isActive
                            });
                            setIsEditUserOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ユーザー詳細表示ダイアログ */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ユーザー詳細</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-medium">
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
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ユーザー編集ダイアログ */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">名前</Label>
                <Input
                  id="edit-name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="ユーザー名を入力"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">メール</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="メールアドレスを入力"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">電話番号</Label>
                <Input
                  id="edit-phone"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  placeholder="電話番号を入力"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">ロール</Label>
                <Select value={editUser.systemRole} onValueChange={(value: any) => setEditUser({ ...editUser, systemRole: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_admin">システム管理者</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="dispatcher">ディスパッチャー</SelectItem>
                    <SelectItem value="engineer_manager">エンジニアマネージャー</SelectItem>
                    <SelectItem value="engineer">エンジニア</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">所属会社</Label>
                <Select value={editUser.companyId.toString()} onValueChange={(value) => setEditUser({ ...editUser, companyId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="会社を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesList.length > 0 ? (
                      companiesList.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        会社データを読み込み中...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">所属部門</Label>
                <Select value={editUser.departmentId.toString()} onValueChange={(value) => setEditUser({ ...editUser, departmentId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-active" 
                checked={editUser.isActive}
                onCheckedChange={(checked) => setEditUser({ ...editUser, isActive: checked as boolean })}
              />
              <Label htmlFor="edit-active">アクティブ</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleEditCancel}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ユーザー削除確認ダイアログ */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー削除の確認</DialogTitle>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">警告</span>
                </div>
                <p className="text-sm text-red-700">
                  <strong>この操作は取り消せません。</strong><br />
                  ユーザー「{userToDelete.name}」を削除してもよろしいですか？
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDeleteCancel} disabled={loading}>
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                '削除する'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 会社編集ダイアログ */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>会社編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-company-name">会社名 *</Label>
              <Input
                id="edit-company-name"
                value={editCompany.name}
                onChange={(e) => setEditCompany({...editCompany, name: e.target.value})}
                placeholder="会社名を入力"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company-address">住所</Label>
              <Input
                id="edit-company-address"
                value={editCompany.address}
                onChange={(e) => setEditCompany({...editCompany, address: e.target.value})}
                placeholder="住所を入力"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-company-phone">電話番号</Label>
                <Input
                  id="edit-company-phone"
                  value={editCompany.phone}
                  onChange={(e) => setEditCompany({...editCompany, phone: e.target.value})}
                  placeholder="電話番号を入力"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company-email">メール</Label>
                <Input
                  id="edit-company-email"
                  type="email"
                  value={editCompany.email}
                  onChange={(e) => setEditCompany({...editCompany, email: e.target.value})}
                  placeholder="メールアドレスを入力"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company-description">説明</Label>
              <Textarea
                id="edit-company-description"
                value={editCompany.description}
                onChange={(e) => setEditCompany({...editCompany, description: e.target.value})}
                placeholder="会社の説明を入力"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditCompany} disabled={companyLoading}>
              {companyLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 会社削除確認ダイアログ */}
      <Dialog open={isDeleteCompanyConfirmOpen} onOpenChange={setIsDeleteCompanyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>会社削除の確認</DialogTitle>
          </DialogHeader>
          {companyToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">警告</span>
                </div>
                <p className="text-sm text-red-700">
                  <strong>この操作は取り消せません。</strong><br />
                  会社「{companyToDelete.name}」を削除してもよろしいですか？
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteCompanyConfirmOpen(false)} disabled={companyLoading}>
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCompany} 
              disabled={companyLoading}
            >
              {companyLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                '削除する'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
