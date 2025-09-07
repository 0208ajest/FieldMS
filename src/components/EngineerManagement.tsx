'use client';

import React, { useState, useEffect } from 'react';
import { 
  addEngineer, 
  getEngineers, 
  updateEngineer, 
  deleteEngineer,
  calculateEngineerProjectCounts
} from '@/lib/firestore';
import { FirestoreEngineer } from '@/types';
import { User } from '@/types';
import { 
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Engineer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  skills: string[];
  status: 'active' | 'inactive' | 'on_leave';
  companyId: number;
  totalProjects: number; // 割り当てられている案件数
  completedProjects: number; // 対応完了した案件数
  createdAt: Date;
  updatedAt: Date;
}

interface EngineerManagementProps {
  currentUser: User;
}

export default function EngineerManagement({ }: EngineerManagementProps) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ソート機能
  const [sortField, setSortField] = useState<'name' | 'totalProjects' | 'completedProjects' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 新規エンジニア追加
  const [isAddEngineerOpen, setIsAddEngineerOpen] = useState(false);
  const [newEngineer, setNewEngineer] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    skills: [] as string[],
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    companyId: 1
  });
  
  // エンジニア詳細表示
  const [isViewEngineerOpen, setIsViewEngineerOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  
  // エンジニア編集
  const [isEditEngineerOpen, setIsEditEngineerOpen] = useState(false);
  const [engineerToEdit, setEngineerToEdit] = useState<Engineer | null>(null);
  const [editEngineer, setEditEngineer] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    skills: [] as string[],
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    companyId: 1
  });
  
  // 削除確認
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [engineerToDelete, setEngineerToDelete] = useState<Engineer | null>(null);

  // エンジニア一覧を取得
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const firestoreEngineers = await getEngineers();
        console.log('📋 Firestoreから取得したエンジニアデータ:', firestoreEngineers);
        console.log('🔍 各エンジニアのID詳細:', firestoreEngineers.map(e => ({ id: e.id, name: e.name, idType: typeof e.id })));
        console.log('🔍 Firestoreエンジニア数:', firestoreEngineers.length);
        console.log('🔍 各エンジニアの完全なデータ:', firestoreEngineers);
        console.log('🔍 各エンジニアのドキュメントID:', firestoreEngineers.map(e => ({ id: e.id, name: e.name, hasId: !!e.id })));
        
        // 各エンジニアの案件数を動的計算
        const engineersWithProjectCounts = await Promise.all(
          firestoreEngineers.map(async (firestoreEngineer) => {
            const projectCounts = await calculateEngineerProjectCounts(firestoreEngineer.id);
            
            return {
              id: firestoreEngineer.id, // Firestoreの実際のドキュメントIDを保持
              name: firestoreEngineer.name,
              email: firestoreEngineer.email,
              phone: firestoreEngineer.phone || '',
              department: firestoreEngineer.department,
              skills: firestoreEngineer.skills,
              status: firestoreEngineer.status,
              companyId: parseInt(firestoreEngineer.companyId) || 1,
              totalProjects: projectCounts.totalProjects,
              completedProjects: projectCounts.completedProjects,
              createdAt: firestoreEngineer.createdAt,
              updatedAt: firestoreEngineer.updatedAt,
            };
          })
        );
        
        console.log('🔄 変換後のエンジニアデータ（案件数計算済み）:', engineersWithProjectCounts);
        setEngineers(engineersWithProjectCounts);
      } catch (err) {
        console.error('❌ エンジニア一覧取得エラー:', err);
        setError(`エンジニア一覧の取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEngineers();
  }, []);

  // 新規エンジニア追加
  const handleAddEngineer = async () => {
    try {
      setLoading(true);
      
      // エラーメッセージをクリア
      setError(null);
      
      // 必須フィールドの検証
      if (!newEngineer.name || !newEngineer.email || !newEngineer.department) {
        setError('名前、メールアドレス、部署は必須項目です。');
        return;
      }
      
      // まずFirestoreにエンジニアを追加（idフィールドなし）
      const engineerDataWithoutId = {
        name: newEngineer.name,
        email: newEngineer.email,
        phone: newEngineer.phone,
        department: newEngineer.department,
        skills: newEngineer.skills,
        status: newEngineer.status || 'active', // デフォルト値を設定
        companyId: newEngineer.companyId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('📝 新規エンジニア追加データ:', {
        engineerData: engineerDataWithoutId,
        newEngineerStatus: newEngineer.status,
        newEngineerObject: newEngineer
      });

      // Firestoreにエンジニアを追加してドキュメントIDを取得
      const newEngineerId = await addEngineer(engineerDataWithoutId as Omit<FirestoreEngineer, 'id'>);
      console.log('✅ 新しいエンジニアが追加されました, ID:', newEngineerId);
      
      
      // 更新されたエンジニア一覧を取得してローカル状態を更新
      const updatedFirestoreEngineers = await getEngineers();
      const updatedConvertedEngineers: Engineer[] = await Promise.all(
        updatedFirestoreEngineers.map(async (firestoreEngineer) => {
          const projectCounts = await calculateEngineerProjectCounts(firestoreEngineer.id);
          return {
            id: firestoreEngineer.id, // Firestoreの実際のドキュメントIDを保持
            name: firestoreEngineer.name,
            email: firestoreEngineer.email,
            phone: firestoreEngineer.phone || '',
            department: firestoreEngineer.department,
            skills: firestoreEngineer.skills,
            status: firestoreEngineer.status,
            companyId: parseInt(firestoreEngineer.companyId) || 1,
            createdAt: firestoreEngineer.createdAt,
            updatedAt: firestoreEngineer.updatedAt,
            totalProjects: projectCounts.totalProjects,
            completedProjects: projectCounts.completedProjects,
          };
        })
      );
      
      setEngineers(updatedConvertedEngineers);
      setIsAddEngineerOpen(false);
      setNewEngineer({
        name: '',
        email: '',
        phone: '',
        department: '',
        skills: [],
        status: 'active',
        companyId: 1
      });
    } catch (err) {
      console.error('❌ エンジニア追加エラー:', err);
      setError(`エンジニアの追加に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // エンジニア詳細表示
  const handleViewEngineer = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setIsViewEngineerOpen(true);
  };

  // エンジニア削除の開始
  const handleDeleteClick = (engineer: Engineer) => {
    setEngineerToDelete(engineer);
    setIsDeleteConfirmOpen(true);
  };

  // エンジニア削除の実行
  const handleDeleteEngineer = async () => {
    if (!engineerToDelete) return;
    
    try {
      setLoading(true);
      
      console.log('🗑️ エンジニア削除開始:', {
        engineerId: engineerToDelete.id,
        engineerName: engineerToDelete.name,
        engineerIdType: typeof engineerToDelete.id,
        engineerObject: engineerToDelete
      });
      
      // Firestoreからエンジニアを削除
      await deleteEngineer(engineerToDelete.id);
      console.log('✅ Firestoreからエンジニアを削除しました');
      
      // ローカル状態を更新
      setEngineers(engineers.filter(e => e.id !== engineerToDelete.id));
      console.log('✅ ローカル状態を更新しました');
      
      // ダイアログを閉じる
      setIsDeleteConfirmOpen(false);
      setEngineerToDelete(null);
    } catch (err) {
      console.error('❌ エンジニア削除エラー:', err);
      console.error('削除エラーの詳細:', {
        error: err,
        engineerId: engineerToDelete.id,
        engineerName: engineerToDelete.name,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined
      });
      setError(`エンジニアの削除に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 削除をキャンセル
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setEngineerToDelete(null);
  };

  // エンジニア編集の開始
  const handleEditEngineer = (engineer: Engineer) => {
    console.log('📝 編集対象エンジニア:', { engineer, engineerId: engineer.id, engineerIdType: typeof engineer.id });
    setEngineerToEdit(engineer);
    setEditEngineer({
      name: engineer.name,
      email: engineer.email,
      phone: engineer.phone || '',
      department: engineer.department,
      skills: engineer.skills,
      status: engineer.status,
      companyId: engineer.companyId
    });
    setIsEditEngineerOpen(true);
  };

  // エンジニア編集の実行
  const handleUpdateEngineer = async () => {
    if (!engineerToEdit) return;
    
    try {
      setLoading(true);
      
      // エラーメッセージをクリア
      setError(null);
      
      // 必須フィールドの検証
      if (!editEngineer.name || !editEngineer.email || !editEngineer.department) {
        setError('名前、メールアドレス、部署は必須項目です。');
        return;
      }
      
      console.log('🔄 エンジニア更新開始:', {
        engineerId: engineerToEdit.id,
        engineerData: editEngineer
      });
      
      // Firestoreの接続状態を確認
      console.log('🔍 Firestore接続確認:', {
        updateEngineerFunction: typeof updateEngineer,
        engineerId: engineerToEdit.id,
        engineerIdType: typeof engineerToEdit.id
      });
      
      // 更新データを準備（idフィールドは除外）
      const updateData = {
        name: editEngineer.name,
        email: editEngineer.email,
        phone: editEngineer.phone,
        department: editEngineer.department,
        skills: editEngineer.skills,
        status: editEngineer.status || 'active', // デフォルト値を設定
        companyId: editEngineer.companyId.toString(),
        updatedAt: new Date()
      };
      
      console.log('📝 更新データ詳細:', {
        engineerId: engineerToEdit.id,
        updateData: updateData,
        documentPath: `engineers/${engineerToEdit.id}`,
        editEngineerStatus: editEngineer.status,
        editEngineerObject: editEngineer
      });
      
      // Firestoreでエンジニアを更新
      await updateEngineer(engineerToEdit.id, updateData);
      
      console.log('✅ エンジニア更新成功');
      
      // ローカル状態を更新
      setEngineers(engineers.map(e => 
        e.id === engineerToEdit.id 
          ? { ...e, ...editEngineer, updatedAt: new Date() }
          : e
      ));
      
      // ダイアログを閉じる
      setIsEditEngineerOpen(false);
      setEngineerToEdit(null);
    } catch (err) {
      console.error('❌ エンジニア更新エラー:', err);
      console.error('更新エラーの詳細:', {
        error: err,
        engineerId: engineerToEdit.id,
        engineerName: engineerToEdit.name,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined
      });
      setError(`エンジニアの更新に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 編集をキャンセル
  const handleEditCancel = () => {
    setIsEditEngineerOpen(false);
    setEngineerToEdit(null);
  };

  // スキル文字列を配列に変換
  const parseSkills = (skillsString: string): string[] => {
    return skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  };

  // 配列をスキル文字列に変換
  const skillsToString = (skills: string[]): string => {
    return skills.join(', ');
  };

  // ソート機能
  const handleSort = (field: 'name' | 'totalProjects' | 'completedProjects' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートされたエンジニア一覧を取得
  const sortedEngineers = [...engineers].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];

    if (sortField === 'name') {
      aValue = (aValue as string).toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading && engineers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">エンジニア一覧を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">エンジニア管理</h1>
          <p className="text-gray-600">エンジニアの情報を管理します</p>
        </div>
        <Button onClick={() => setIsAddEngineerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          エンジニア追加
        </Button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* エンジニア一覧テーブル */}
      <div className="bg-white shadow rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('name')}
              >
                名前 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>部署</TableHead>
              <TableHead>スキル</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('status')}
              >
                ステータス {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('totalProjects')}
              >
                案件数 {sortField === 'totalProjects' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('completedProjects')}
              >
                完了数 {sortField === 'completedProjects' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEngineers.map((engineer) => (
              <TableRow key={engineer.id}>
                <TableCell className="font-medium">{engineer.name}</TableCell>
                <TableCell>{engineer.email}</TableCell>
                <TableCell>{engineer.phone || '-'}</TableCell>
                <TableCell>{engineer.department}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {engineer.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={engineer.status === 'active' ? 'default' : 'secondary'}
                    className={
                      engineer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : engineer.status === 'on_leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {engineer.status === 'active' ? 'アクティブ' : 
                     engineer.status === 'on_leave' ? '休職中' : '非アクティブ'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-blue-600">{engineer.totalProjects}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-green-600">{engineer.completedProjects}</span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEngineer(engineer)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEngineer(engineer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(engineer)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 新規エンジニア追加ダイアログ */}
      <Dialog open={isAddEngineerOpen} onOpenChange={setIsAddEngineerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>エンジニア追加</DialogTitle>
            <DialogDescription>
              新しいエンジニアの情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                value={newEngineer.name}
                onChange={(e) => setNewEngineer({ ...newEngineer, name: e.target.value })}
                placeholder="山田太郎"
              />
            </div>
            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={newEngineer.email}
                onChange={(e) => setNewEngineer({ ...newEngineer, email: e.target.value })}
                placeholder="yamada@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={newEngineer.phone}
                onChange={(e) => setNewEngineer({ ...newEngineer, phone: e.target.value })}
                placeholder="090-1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="department">部署 *</Label>
              <Input
                id="department"
                value={newEngineer.department}
                onChange={(e) => setNewEngineer({ ...newEngineer, department: e.target.value })}
                placeholder="開発部"
              />
            </div>
            <div>
              <Label htmlFor="skills">スキル</Label>
              <Input
                id="skills"
                value={skillsToString(newEngineer.skills)}
                onChange={(e) => setNewEngineer({ ...newEngineer, skills: parseSkills(e.target.value) })}
                placeholder="JavaScript, React, Node.js"
              />
            </div>
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={newEngineer.status}
                onValueChange={(value: 'active' | 'inactive' | 'on_leave') => 
                  setNewEngineer({ ...newEngineer, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                  <SelectItem value="on_leave">休職中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEngineerOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddEngineer} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エンジニア詳細表示ダイアログ */}
      <Dialog open={isViewEngineerOpen} onOpenChange={setIsViewEngineerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>エンジニア詳細</DialogTitle>
            <DialogDescription>
              {selectedEngineer?.name}の詳細情報
            </DialogDescription>
          </DialogHeader>
          {selectedEngineer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>名前</Label>
                  <p className="text-sm text-gray-900">{selectedEngineer.name}</p>
                </div>
                <div>
                  <Label>メールアドレス</Label>
                  <p className="text-sm text-gray-900">{selectedEngineer.email}</p>
                </div>
                <div>
                  <Label>電話番号</Label>
                  <p className="text-sm text-gray-900">{selectedEngineer.phone || '-'}</p>
                </div>
                <div>
                  <Label>部署</Label>
                  <p className="text-sm text-gray-900">{selectedEngineer.department}</p>
                </div>
                <div>
                  <Label>ステータス</Label>
                  <Badge 
                    variant={selectedEngineer.status === 'active' ? 'default' : 'secondary'}
                    className={
                      selectedEngineer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedEngineer.status === 'on_leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedEngineer.status === 'active' ? 'アクティブ' : 
                     selectedEngineer.status === 'on_leave' ? '休職中' : '非アクティブ'}
                  </Badge>
                </div>
                <div>
                  <Label>作成日</Label>
                  <p className="text-sm text-gray-900">
                    {selectedEngineer.createdAt.toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
              <div>
                <Label>スキル</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEngineer.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewEngineerOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エンジニア編集ダイアログ */}
      <Dialog open={isEditEngineerOpen} onOpenChange={setIsEditEngineerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>エンジニア編集</DialogTitle>
            <DialogDescription>
              {engineerToEdit?.name}の情報を編集してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">名前 *</Label>
              <Input
                id="edit-name"
                value={editEngineer.name}
                onChange={(e) => setEditEngineer({ ...editEngineer, name: e.target.value })}
                placeholder="山田太郎"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">メールアドレス *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEngineer.email}
                onChange={(e) => setEditEngineer({ ...editEngineer, email: e.target.value })}
                placeholder="yamada@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">電話番号</Label>
              <Input
                id="edit-phone"
                value={editEngineer.phone}
                onChange={(e) => setEditEngineer({ ...editEngineer, phone: e.target.value })}
                placeholder="090-1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="edit-department">部署 *</Label>
              <Input
                id="edit-department"
                value={editEngineer.department}
                onChange={(e) => setEditEngineer({ ...editEngineer, department: e.target.value })}
                placeholder="開発部"
              />
            </div>
            <div>
              <Label htmlFor="edit-skills">スキル</Label>
              <Input
                id="edit-skills"
                value={skillsToString(editEngineer.skills)}
                onChange={(e) => setEditEngineer({ ...editEngineer, skills: parseSkills(e.target.value) })}
                placeholder="JavaScript, React, Node.js"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">ステータス</Label>
              <Select
                value={editEngineer.status}
                onValueChange={(value: 'active' | 'inactive' | 'on_leave') => 
                  setEditEngineer({ ...editEngineer, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                  <SelectItem value="on_leave">休職中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateEngineer} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>エンジニア削除の確認</DialogTitle>
            <DialogDescription>
              本当に「{engineerToDelete?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEngineer}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}