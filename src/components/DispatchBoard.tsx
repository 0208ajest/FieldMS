'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Plus, User, MapPin, Clock, Calendar, MoreHorizontal, CheckCircle } from 'lucide-react';
import { User as UserType, WorkOrder } from '@/types';
import { workOrders, engineers } from '@/components/data/engineerData';

interface DispatchBoardProps {
  currentUser: UserType;
}

export default function DispatchBoard({ currentUser: _currentUser }: DispatchBoardProps) {
  const [draggedItem, setDraggedItem] = useState<typeof workOrders[0] | null>(null);
  const [isNewWorkOrderOpen, setIsNewWorkOrderOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<typeof workOrders[0] | null>(null);
  const [workOrdersList, setWorkOrdersList] = useState(workOrders);
  const [filters, setFilters] = useState({
    priority: 'all',
    engineer: 'all',
    status: 'all'
  });

  const [newWorkOrder, setNewWorkOrder] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    estimatedDuration: '',
    dueDate: '',
    customerName: '',
    customerPhone: ''
  });

  // フィルタリングされた作業指示書を取得
  const getFilteredWorkOrders = () => {
    return workOrdersList.filter(wo => {
      const matchesPriority = filters.priority === 'all' || wo.priority === filters.priority;
      const matchesEngineer = filters.engineer === 'all' || wo.assignedEngineerId?.toString() === filters.engineer;
      const matchesStatus = filters.status === 'all' || wo.status === filters.status;
      return matchesPriority && matchesEngineer && matchesStatus;
    });
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  // ステータス別に作業指示書を分類
  const unassignedWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'pending');
  const assignedWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'assigned');
  const inProgressWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'in_progress');
  const completedWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'completed');

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急'
  };

  const statusLabels = {
    active: '稼働中',
    available: '待機',
    busy: '作業中',
    inactive: '非稼働',
    on_leave: '休暇中'
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  const handleDragStart = (e: React.DragEvent, workOrder: typeof workOrders[0]) => {
    setDraggedItem(workOrder);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      console.log(`作業指示書 ${draggedItem.id} を ${targetStatus} に移動`);
      // 実際の実装では、ここでステータスを更新
    }
  };

  // 新規作業指示作成
  const handleCreateWorkOrder = () => {
    const workOrder: WorkOrder = {
      id: workOrdersList.length + 1,
      title: newWorkOrder.title,
      description: newWorkOrder.description,
      location: newWorkOrder.location,
      priority: newWorkOrder.priority as 'low' | 'medium' | 'high' | 'urgent',
      estimatedDuration: parseInt(newWorkOrder.estimatedDuration),
      dueDate: new Date(newWorkOrder.dueDate),
      status: 'pending',
      assignedEngineerId: null,
      progress: 0,
      createdAt: new Date(),
      completedAt: null
    };

    setWorkOrdersList([...workOrdersList, workOrder]);
    setIsNewWorkOrderOpen(false);
    setNewWorkOrder({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      estimatedDuration: '',
      dueDate: '',
      customerName: '',
      customerPhone: ''
    });
  };

  // エンジニア割り当て
  const handleAssignEngineer = (engineerId: number) => {
    if (selectedWorkOrder) {
      const updatedWorkOrders = workOrdersList.map(wo => 
        wo.id === selectedWorkOrder.id 
          ? { ...wo, assignedEngineerId: engineerId, status: 'assigned' as const }
          : wo
      );
      setWorkOrdersList(updatedWorkOrders);
      setIsAssignDialogOpen(false);
      setSelectedWorkOrder(null);
    }
  };

  // 作業開始
  const handleStartWork = (workOrderId: number) => {
    const updatedWorkOrders = workOrdersList.map(wo => 
      wo.id === workOrderId 
        ? { ...wo, status: 'in_progress' as const }
        : wo
    );
    setWorkOrdersList(updatedWorkOrders);
  };

  // 作業完了
  const handleCompleteWork = (workOrderId: number) => {
    const updatedWorkOrders = workOrdersList.map(wo => 
      wo.id === workOrderId 
        ? { ...wo, status: 'completed' as const, completedAt: new Date() }
        : wo
    );
    setWorkOrdersList(updatedWorkOrders);
  };

  const openAssignDialog = (workOrder: typeof workOrders[0]) => {
    setSelectedWorkOrder(workOrder);
    setIsAssignDialogOpen(true);
  };

  const openEngineerDetails = (engineer: typeof engineers[0]) => {
    console.log('エンジニア詳細:', engineer);
  };

  return (
    <div className="space-y-6">
      {/* ディスパッチヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ディスパッチボード</h1>
          <p className="text-muted-foreground">作業指示書の割り当てと進捗管理</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                フィルター
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>フィルター設定</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority-filter">優先度</Label>
                  <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engineer-filter">エンジニア</Label>
                  <Select value={filters.engineer} onValueChange={(value) => setFilters({...filters, engineer: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {engineers.map(engineer => (
                        <SelectItem key={engineer.id} value={engineer.id.toString()}>
                          {engineer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status-filter">ステータス</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="pending">未割り当て</SelectItem>
                      <SelectItem value="assigned">割り当て済み</SelectItem>
                      <SelectItem value="in_progress">進行中</SelectItem>
                      <SelectItem value="completed">完了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFilters({priority: 'all', engineer: 'all', status: 'all'})}>
                  リセット
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>
                  適用
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isNewWorkOrderOpen} onOpenChange={setIsNewWorkOrderOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新規作業指示
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新規作業指示</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={newWorkOrder.title}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, title: e.target.value})}
                    placeholder="作業指示のタイトル"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">詳細</Label>
                  <Textarea
                    id="description"
                    value={newWorkOrder.description}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, description: e.target.value})}
                    placeholder="作業内容の詳細"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">場所</Label>
                    <Input
                      id="location"
                      value={newWorkOrder.location}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, location: e.target.value})}
                      placeholder="作業場所"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">優先度</Label>
                    <Select value={newWorkOrder.priority} onValueChange={(value) => setNewWorkOrder({...newWorkOrder, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="urgent">緊急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">予想時間（分）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newWorkOrder.estimatedDuration}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, estimatedDuration: e.target.value})}
                      placeholder="60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">期限</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newWorkOrder.dueDate}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">顧客名</Label>
                    <Input
                      id="customerName"
                      value={newWorkOrder.customerName}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, customerName: e.target.value})}
                      placeholder="顧客名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerPhone">顧客電話</Label>
                    <Input
                      id="customerPhone"
                      value={newWorkOrder.customerPhone}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, customerPhone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewWorkOrderOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateWorkOrder}>
                  作成
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* フィルター・集計バー */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">優先度:</span>
          <Badge variant="outline" className="border-red-200 text-red-700">緊急: 2件</Badge>
          <Badge variant="outline" className="border-orange-200 text-orange-700">高: 5件</Badge>
          <Badge variant="outline" className="border-yellow-200 text-yellow-700">中: 8件</Badge>
          <Badge variant="outline" className="border-gray-200 text-gray-700">低: 3件</Badge>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">エンジニア:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700">稼働中: 15人</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">待機: 9人</Badge>
        </div>
      </div>

      {/* カンバンボードメインエリア */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        
        {/* 未割り当てカラム */}
        <div className="flex-shrink-0 w-80">
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  未割り当て
                </h3>
                <Badge variant="secondary">{unassignedWorkOrders.length}件</Badge>
              </div>
            </div>
            
            {/* ドロップゾーン */}
            <div className="p-2 space-y-2 min-h-96 max-h-96 overflow-y-auto">
              {unassignedWorkOrders.map(workOrder => (
                <div
                  key={workOrder.id}
                  className="p-3 border rounded-lg cursor-move hover:shadow-sm bg-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, workOrder)}
                  onDragEnd={handleDragEnd}
                >
                  {/* 優先度インジケーター */}
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`text-xs ${
                      workOrder.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      workOrder.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      workOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {priorityLabels[workOrder.priority as keyof typeof priorityLabels]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{workOrder.id}</span>
                  </div>
                  
                  {/* タイトル・説明 */}
                  <h4 className="font-medium text-sm mb-1">{workOrder.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {workOrder.description}
                  </p>
                  
                  {/* 顧客・場所情報 */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{workOrder.location}</span>
                  </div>
                  
                  {/* 期限・工数 */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{workOrder.estimatedDuration}分</span>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      isOverdue(workOrder.dueDate) ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(workOrder.dueDate)}</span>
                    </div>
                  </div>
                  
                  {/* 割り当てボタン */}
                  <div className="mt-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => openAssignDialog(workOrder)}
                    >
                      <User className="w-3 h-3 mr-1" />
                      エンジニア割り当て
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 割り当て済みカラム */}
        <div className="flex-shrink-0 w-80">
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  割り当て済み
                </h3>
                <Badge variant="secondary">{assignedWorkOrders.length}件</Badge>
              </div>
            </div>
            
            <div 
              className="p-2 space-y-2 min-h-96 max-h-96 overflow-y-auto"
              onDrop={(e) => handleDrop(e, 'assigned')}
              onDragOver={(e) => e.preventDefault()}
            >
              {assignedWorkOrders.map(workOrder => {
                const assignedEngineer = engineers.find(e => e.id === workOrder.assignedEngineerId);
                return (
                  <div
                    key={workOrder.id}
                    className="p-3 border rounded-lg cursor-move hover:shadow-sm bg-card"
                  >
                    {/* 割り当てられたエンジニア情報 */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {assignedEngineer?.name[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{assignedEngineer?.name || '不明'}</span>
                      <Badge className="ml-auto text-xs bg-blue-100 text-blue-700">
                        {priorityLabels[workOrder.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    
                    {/* 作業内容 */}
                    <h4 className="font-medium text-sm mb-1">{workOrder.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{workOrder.location}</span>
                    </div>
                    
                    {/* ステータス更新ボタン */}
                    <div className="flex gap-1 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => handleStartWork(workOrder.id)}
                      >
                        開始
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 進行中カラム */}
        <div className="flex-shrink-0 w-80">
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  進行中
                </h3>
                <Badge variant="secondary">{inProgressWorkOrders.length}件</Badge>
              </div>
            </div>
            
            <div className="p-2 space-y-2 min-h-96 max-h-96 overflow-y-auto">
              {inProgressWorkOrders.map(workOrder => {
                const assignedEngineer = engineers.find(e => e.id === workOrder.assignedEngineerId);
                return (
                  <div key={workOrder.id} className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                    {/* 進行中表示 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-orange-700">進行中</span>
                      <Badge className="ml-auto text-xs bg-orange-100 text-orange-700">
                        {assignedEngineer?.name || '不明'}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{workOrder.title}</h4>
                    
                    {/* 進捗バー */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>進捗</span>
                        <span>{workOrder.progress || 0}%</span>
                      </div>
                      <Progress value={workOrder.progress || 0} className="h-2" />
                    </div>
                    
                    {/* 完了ボタン */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => handleCompleteWork(workOrder.id)}
                    >
                      完了報告
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 完了カラム */}
        <div className="flex-shrink-0 w-80">
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  完了
                </h3>
                <Badge variant="secondary">{completedWorkOrders.length}件</Badge>
              </div>
            </div>
            
            <div className="p-2 space-y-2 min-h-96 max-h-96 overflow-y-auto">
              {completedWorkOrders.map(workOrder => {
                const assignedEngineer = engineers.find(e => e.id === workOrder.assignedEngineerId);
                return (
                  <div key={workOrder.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">完了</span>
                      <Badge className="ml-auto text-xs bg-green-100 text-green-700">
                        {workOrder.completedAt ? formatTime(workOrder.completedAt) : '完了'}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{workOrder.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      担当: {assignedEngineer?.name || '不明'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* エンジニア状況セクション（下部） */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4">エンジニア状況</h3>
          <div className="flex gap-4 overflow-x-auto">
            {engineers.map(engineer => (
              <div 
                key={engineer.id} 
                className="flex-shrink-0 p-3 border rounded-lg min-w-48 cursor-pointer hover:bg-muted/50"
                onClick={() => openEngineerDetails(engineer)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {engineer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{engineer.name}</p>
                    <Badge className={`text-xs ${
                      engineer.status === 'available' ? 'bg-green-100 text-green-700' :
                      engineer.status === 'busy' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {statusLabels[engineer.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
                
                {engineer.currentTask ? (
                  <div className="text-xs text-muted-foreground">
                    <p>現在: {engineer.currentTask.title}</p>
                    <p>場所: {engineer.currentTask.location}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">待機中</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* エンジニア割り当てダイアログ */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>エンジニア割り当て</DialogTitle>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">{selectedWorkOrder.title}</h4>
                <p className="text-xs text-muted-foreground">{selectedWorkOrder.description}</p>
              </div>
              <div className="space-y-2">
                <Label>担当エンジニアを選択</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {engineers.filter(e => e.status === 'available' || e.status === 'active').map(engineer => (
                    <div 
                      key={engineer.id}
                      className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAssignEngineer(engineer.id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {engineer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{engineer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {engineer.skills.slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <Badge className={`text-xs ${
                        engineer.status === 'available' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {statusLabels[engineer.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
