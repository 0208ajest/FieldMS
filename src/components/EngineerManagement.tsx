'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Download, Upload, Plus, Eye, Edit, Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { User, Engineer } from '@/types';
import { engineers } from '@/components/data/engineerData';

interface EngineerManagementProps {
  currentUser: User;
  onNavigateToSchedule: (engineerId?: number) => void;
}

export default function EngineerManagement({ currentUser: _currentUser, onNavigateToSchedule }: EngineerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddEngineerOpen, setIsAddEngineerOpen] = useState(false);
  const [isViewEngineerOpen, setIsViewEngineerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [engineerToDelete, setEngineerToDelete] = useState<Engineer | null>(null);
  const [engineersList, setEngineersList] = useState(engineers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEngineer, setNewEngineer] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: 1,
    skills: [] as string[],
    status: 'available',
    avatar: '',
    currentTask: '',
    progress: 0
  });

  // フィルタリングされたエンジニアリスト
  const filteredEngineers = engineersList.filter(engineer => {
    const matchesSearch = engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engineer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = departmentFilter === 'all' || engineer.departmentId.toString() === departmentFilter;
    const matchesStatus = statusFilter === 'all' || engineer.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // CSV出力機能
  const handleCSVExport = () => {
    const csvContent = [
      ['名前', 'メール', '電話', '部門', 'スキル', 'ステータス'].join(','),
      ...filteredEngineers.map(engineer => [
        engineer.name,
        engineer.email,
        engineer.phone,
        engineer.departmentId === 1 ? '技術部' : '保守部',
        engineer.skills.join(';'),
        engineer.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `engineers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV取込機能
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const importedEngineers: Engineer[] = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        return {
          id: engineersList.length + index + 1,
          name: values[0] || '',
          email: values[1] || '',
          phone: values[2] || '',
          departmentId: values[3] === '技術部' ? 1 : 2,
          skills: values[4] ? values[4].split(';') : [],
          status: (values[5] || 'available') as 'active' | 'available' | 'busy' | 'inactive' | 'on_leave',
          avatar: '',
          currentTask: undefined,
          progress: 0
        };
      }).filter(engineer => engineer.name);

      setEngineersList([...engineersList, ...importedEngineers]);
    };
    reader.readAsText(file);
  };

  // エンジニア追加
  const handleAddEngineer = () => {
    const engineer: Engineer = {
      id: engineersList.length + 1,
      name: newEngineer.name,
      email: newEngineer.email,
      phone: newEngineer.phone,
      departmentId: newEngineer.departmentId,
      skills: newEngineer.skills,
      status: newEngineer.status as 'active' | 'available' | 'busy' | 'inactive' | 'on_leave',
      avatar: newEngineer.avatar,
      currentTask: newEngineer.currentTask ? { title: newEngineer.currentTask, location: '' } : undefined,
      progress: newEngineer.progress
    };
    setEngineersList([...engineersList, engineer]);
    setIsAddEngineerOpen(false);
    setNewEngineer({
      name: '',
      email: '',
      phone: '',
      departmentId: 1,
      skills: [],
      status: 'available',
      avatar: '',
      currentTask: '',
      progress: 0
    });
  };

  // エンジニア編集
  const handleEditEngineer = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    // 編集機能は今後実装予定
    console.log('エンジニア編集:', engineer);
  };

  // エンジニア削除確認
  const handleDeleteEngineer = (engineer: Engineer) => {
    setEngineerToDelete(engineer);
    setIsDeleteConfirmOpen(true);
  };

  // エンジニア削除実行
  const confirmDeleteEngineer = () => {
    if (engineerToDelete) {
      setEngineersList(engineersList.filter(e => e.id !== engineerToDelete.id));
      setIsDeleteConfirmOpen(false);
      setEngineerToDelete(null);
    }
  };

  // エンジニア詳細表示
  const handleViewEngineer = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setIsViewEngineerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: '稼働中', className: 'bg-green-100 text-green-700 border-green-200' },
      available: { label: '待機', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      busy: { label: '作業中', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      inactive: { label: '非稼働', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      on_leave: { label: '休暇中', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.inactive;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー + アクション */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">エンジニア管理</h1>
          <p className="text-muted-foreground">エンジニアの登録・編集・スケジュール管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCSVExport}>
            <Download className="w-4 h-4 mr-2" />
            CSV出力
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            CSV取込
          </Button>
          <Dialog open={isAddEngineerOpen} onOpenChange={setIsAddEngineerOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                エンジニア追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>エンジニア追加</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      value={newEngineer.name}
                      onChange={(e) => setNewEngineer({...newEngineer, name: e.target.value})}
                      placeholder="エンジニア名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">メール</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEngineer.email}
                      onChange={(e) => setNewEngineer({...newEngineer, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={newEngineer.phone}
                      onChange={(e) => setNewEngineer({...newEngineer, phone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">部門</Label>
                    <Select value={newEngineer.departmentId.toString()} onValueChange={(value) => setNewEngineer({...newEngineer, departmentId: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">技術部</SelectItem>
                        <SelectItem value="2">保守部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="skills">スキル</Label>
                  <Input
                    id="skills"
                    value={newEngineer.skills.join(', ')}
                    onChange={(e) => setNewEngineer({...newEngineer, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                    placeholder="JavaScript, React, Node.js"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">ステータス</Label>
                  <Select value={newEngineer.status} onValueChange={(value) => setNewEngineer({...newEngineer, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">待機</SelectItem>
                      <SelectItem value="active">稼働中</SelectItem>
                      <SelectItem value="busy">作業中</SelectItem>
                      <SelectItem value="inactive">非稼働</SelectItem>
                      <SelectItem value="on_leave">休暇中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddEngineerOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddEngineer}>
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
                placeholder="名前、メール、スキルで検索..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* 部門フィルター */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="部門を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての部門</SelectItem>
              <SelectItem value="1">技術部</SelectItem>
              <SelectItem value="2">保守部</SelectItem>
            </SelectContent>
          </Select>

          {/* ステータスフィルター */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">稼働中</SelectItem>
              <SelectItem value="available">待機</SelectItem>
              <SelectItem value="busy">作業中</SelectItem>
              <SelectItem value="inactive">非稼働</SelectItem>
              <SelectItem value="on_leave">休暇中</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* エンジニアテーブル */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-64">エンジニア</TableHead>
              <TableHead className="w-48">連絡先</TableHead>
              <TableHead className="w-32">部門</TableHead>
              <TableHead className="w-64">スキル</TableHead>
              <TableHead className="w-24">ステータス</TableHead>
              <TableHead className="w-32 text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEngineers.map((engineer) => (
              <TableRow key={engineer.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* アバター */}
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={engineer.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {engineer.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{engineer.name}</p>
                      <p className="text-xs text-muted-foreground">ID: ENG{engineer.id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{engineer.email}</p>
                    <p className="text-xs text-muted-foreground">{engineer.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {engineer.departmentId === 1 ? '技術部' : '保守部'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {engineer.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {engineer.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{engineer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(engineer.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewEngineer(engineer)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEngineer(engineer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onNavigateToSchedule(engineer.id)}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEngineer(engineer)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* ページネーション */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredEngineers.length}人中 1-{Math.min(filteredEngineers.length, 10)}人を表示
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

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleCSVImport}
        style={{ display: 'none' }}
      />

      {/* エンジニア詳細表示ダイアログ */}
      <Dialog open={isViewEngineerOpen} onOpenChange={setIsViewEngineerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>エンジニア詳細</DialogTitle>
          </DialogHeader>
          {selectedEngineer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedEngineer.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {selectedEngineer.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEngineer.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: ENG{selectedEngineer.id.toString().padStart(3, '0')}</p>
                  {getStatusBadge(selectedEngineer.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">メール</Label>
                  <p className="text-sm">{selectedEngineer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">電話</Label>
                  <p className="text-sm">{selectedEngineer.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">部門</Label>
                  <p className="text-sm">{selectedEngineer.departmentId === 1 ? '技術部' : '保守部'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">現在のタスク</Label>
                  <p className="text-sm">{selectedEngineer.currentTask?.title || 'なし'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">スキル</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEngineer.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewEngineerOpen(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>エンジニア削除確認</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              以下のエンジニアを削除しますか？この操作は取り消すことができません。
            </p>
            {engineerToDelete && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={engineerToDelete.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {engineerToDelete.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{engineerToDelete.name}</p>
                  <p className="text-sm text-muted-foreground">{engineerToDelete.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEngineer}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
