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
import { Search, Download, Upload, Plus, Eye, Edit, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '@/types';
import { engineers } from '@/components/data/engineerData';

interface EngineerManagementProps {
  currentUser: User;
  onNavigateToSchedule: (engineerId?: number) => void;
}

export default function EngineerManagement({ currentUser: _currentUser, onNavigateToSchedule }: EngineerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // フィルタリングされたエンジニアリスト
  const filteredEngineers = engineers.filter(engineer => {
    const matchesSearch = engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engineer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = departmentFilter === 'all' || engineer.departmentId.toString() === departmentFilter;
    const matchesStatus = statusFilter === 'all' || engineer.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

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
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV出力
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            CSV取込
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            エンジニア追加
          </Button>
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
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onNavigateToSchedule(engineer.id)}
                    >
                      <Calendar className="w-4 h-4" />
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
    </div>
  );
}
