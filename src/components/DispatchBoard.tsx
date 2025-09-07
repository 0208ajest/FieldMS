'use client';

import { useState, useEffect } from 'react';
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
import { Filter, Plus, User, MapPin, Clock, Calendar, MoreHorizontal, CheckCircle, Clipboard } from 'lucide-react';
import { User as UserType, WorkOrder, Schedule, Engineer } from '@/types';
import { 
  addWorkOrder, 
  getWorkOrders, 
  updateWorkOrder,
  getEngineers,
  getSchedules,
  addSchedule,
  updateSchedule
} from '@/lib/firestore';

interface DispatchBoardProps {
  currentUser: UserType;
}

export default function DispatchBoard({ }: DispatchBoardProps) {
  const [draggedItem, setDraggedItem] = useState<UnifiedItem | null>(null);
  const [isNewWorkOrderOpen, setIsNewWorkOrderOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<UnifiedItem | null>(null);
  const [workOrdersList, setWorkOrdersList] = useState<WorkOrder[]>([]);
  const [schedulesList, setSchedulesList] = useState<Schedule[]>([]);
  const [firebaseEngineers, setFirebaseEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
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
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    customerName: '',
    customerPhone: '',
    assignedEngineerId: 'unassigned'
  });

  const [recommendedEngineers, setRecommendedEngineers] = useState<Engineer[]>([]);

  // Firebaseからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📋 ディスパッチデータを取得中...');
        
        // エンジニアデータを取得
        const firestoreEngineers = await getEngineers();
        console.log('👨‍💻 取得したFirestoreエンジニア:', firestoreEngineers);
        
        const convertedEngineers = firestoreEngineers.map((firestoreEngineer) => ({
          id: firestoreEngineer.id as string,
          name: firestoreEngineer.name as string,
          email: firestoreEngineer.email as string,
          phone: (firestoreEngineer.phone as string) || '',
          departmentId: parseInt(firestoreEngineer.companyId as string) || 1,
          skills: (firestoreEngineer.skills as string[]) || [],
          status: firestoreEngineer.status as 'active' | 'inactive',
          totalProjects: 0,
          completedProjects: 0,
          createdAt: firestoreEngineer.createdAt as Date,
          updatedAt: firestoreEngineer.updatedAt as Date,
        }));
        setFirebaseEngineers(convertedEngineers);
        
        // 作業指示データを取得
        const firestoreWorkOrders = await getWorkOrders();
        console.log('📋 取得したFirestore作業指示:', firestoreWorkOrders);
        
        // FirestoreWorkOrderをWorkOrder型に変換
        const convertedWorkOrders: WorkOrder[] = firestoreWorkOrders.map(firestoreWorkOrder => ({
          id: parseInt(firestoreWorkOrder.id) || 0,
          title: firestoreWorkOrder.title,
          description: firestoreWorkOrder.description,
          location: firestoreWorkOrder.location,
          priority: firestoreWorkOrder.priority,
          status: firestoreWorkOrder.status,
          assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
          estimatedDuration: firestoreWorkOrder.estimatedDuration,
          actualDuration: firestoreWorkOrder.actualDuration,
          createdAt: firestoreWorkOrder.createdAt,
          updatedAt: firestoreWorkOrder.updatedAt,
          dueDate: firestoreWorkOrder.dueDate,
          firebaseId: firestoreWorkOrder.id
        }));
        
        console.log('📋 変換後の作業指示データ:', convertedWorkOrders);
        console.log('📋 作業指示データの件数:', convertedWorkOrders.length);
        setWorkOrdersList(convertedWorkOrders);
        
        // スケジュールデータも取得
        const firestoreSchedules = await getSchedules();
        console.log('📅 取得したFirestoreスケジュール:', firestoreSchedules);
        
        // FirestoreScheduleをSchedule型に変換
        const convertedSchedules: Schedule[] = firestoreSchedules.map(firestoreSchedule => ({
          id: parseInt(firestoreSchedule.id) || 0,
          title: firestoreSchedule.title,
          description: firestoreSchedule.description,
          engineerId: firestoreSchedule.engineerId || '',
          engineerName: firestoreSchedule.engineerName || '',
          startDate: firestoreSchedule.startTime.toISOString(),
          endDate: firestoreSchedule.endTime.toISOString(),
          status: firestoreSchedule.status,
          priority: firestoreSchedule.priority || 'medium',
          workOrderId: parseInt(firestoreSchedule.workOrderId || '0') || 0,
          location: firestoreSchedule.location,
          customerName: '',
          customerPhone: '',
          firebaseId: firestoreSchedule.id
        }));
        
        console.log('📅 変換後のスケジュールデータ:', convertedSchedules);
        setSchedulesList(convertedSchedules);
      } catch (err) {
        console.error('❌ データ取得エラー:', err);
        console.error('❌ エラーの詳細:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          name: err instanceof Error ? err.name : undefined
        });
        setError(`データの取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 統合されたアイテムの型定義
  type UnifiedItem = (Schedule & { type: 'schedule' }) | (WorkOrder & { type: 'workOrder' });

  // フィルタリングされた作業指示書を取得（スケジュールも含む）
  const getFilteredWorkOrders = (): UnifiedItem[] => {
    // 作業指示を統合アイテム形式に変換
    const workOrdersAsItems: UnifiedItem[] = workOrdersList.map(wo => ({
      ...wo,
      type: 'workOrder' as const
    }));

    // スケジュールを統合アイテム形式に変換
    const schedulesAsItems: UnifiedItem[] = schedulesList.map(schedule => ({
      ...schedule,
      type: 'schedule' as const
    }));

    // 作業指示とスケジュールを結合
    const allItems = [...workOrdersAsItems, ...schedulesAsItems];

    return allItems.filter(item => {
      const matchesPriority = filters.priority === 'all' || item.priority === filters.priority;
      const matchesEngineer = filters.engineer === 'all' || 
        (item.type === 'workOrder' ? item.assignedEngineerId?.toString() === filters.engineer : item.engineerId === filters.engineer);
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      return matchesPriority && matchesEngineer && matchesStatus;
    });
  };

  const filteredWorkOrders = getFilteredWorkOrders();
  
  // デバッグ用ログ
  console.log('🔍 フィルタリング後の作業指示データ:', filteredWorkOrders);
  console.log('🔍 フィルタリング後の件数:', filteredWorkOrders.length);

  // ステータス別に作業指示書を分類
  const unassignedWorkOrders = filteredWorkOrders.filter(item => item.status === 'pending');
  const assignedWorkOrders = filteredWorkOrders.filter(item => item.status === 'assigned' || item.status === 'scheduled');
  const inProgressWorkOrders = filteredWorkOrders.filter(item => item.status === 'in_progress');
  const completedWorkOrders = filteredWorkOrders.filter(item => item.status === 'completed');
  
  // デバッグ用ログ
  console.log('📊 ステータス別分類結果:');
  console.log('  - 未割り当て:', unassignedWorkOrders.length);
  console.log('  - 割り当て済み:', assignedWorkOrders.length);
  console.log('  - 進行中:', inProgressWorkOrders.length);
  console.log('  - 完了:', completedWorkOrders.length);

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急'
  };


  const engineerStatusLabels = {
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

  const isOverdue = (dueDate?: Date) => {
    return dueDate ? new Date() > dueDate : false;
  };

  const handleDragStart = (e: React.DragEvent, workOrder: UnifiedItem) => {
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

  // バリデーション関数
  const validateWorkOrder = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newWorkOrder.title.trim()) {
      errors.title = 'タイトルは必須項目です';
    }
    if (!newWorkOrder.description.trim()) {
      errors.description = '詳細は必須項目です';
    }
    if (!newWorkOrder.location.trim()) {
      errors.location = '場所は必須項目です';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 新規作業指示作成
  const handleCreateWorkOrder = async () => {
    // バリデーションを実行
    if (!validateWorkOrder()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endDateTime = new Date(`${newWorkOrder.endDate || newWorkOrder.startDate || new Date().toISOString().split('T')[0]}T${newWorkOrder.endTime || newWorkOrder.startTime || '18:00'}`);

      // 担当エンジニアの情報を取得
      const assignedEngineer = newWorkOrder.assignedEngineerId && newWorkOrder.assignedEngineerId !== 'unassigned' ? 
        firebaseEngineers.find(e => e.id === newWorkOrder.assignedEngineerId) : null;

      // Firestoreに保存する作業指示データを作成
      const workOrderData = {
        title: newWorkOrder.title,
        description: newWorkOrder.description,
        location: newWorkOrder.location,
        priority: newWorkOrder.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: (newWorkOrder.assignedEngineerId && newWorkOrder.assignedEngineerId !== 'unassigned') ? 'assigned' as const : 'pending' as const,
        engineerId: (newWorkOrder.assignedEngineerId && newWorkOrder.assignedEngineerId !== 'unassigned') ? newWorkOrder.assignedEngineerId : '',
        engineerName: assignedEngineer?.name || '',
        estimatedDuration: parseInt(newWorkOrder.estimatedDuration) || 60,
        dueDate: endDateTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestoreに作業指示を追加
      const workOrderId = await addWorkOrder(workOrderData);
      console.log('✅ 作業指示が作成されました:', workOrderId);

      // エンジニアが割り当てられている場合は、対応するスケジュールも作成
      if (assignedEngineer && newWorkOrder.startDate && newWorkOrder.startTime) {
        const startDateTime = new Date(`${newWorkOrder.startDate}T${newWorkOrder.startTime}`);
        const endDateTime = new Date(`${newWorkOrder.endDate || newWorkOrder.startDate}T${newWorkOrder.endTime || newWorkOrder.startTime}`);
        
        const scheduleData = {
          title: newWorkOrder.title,
          description: newWorkOrder.description,
          startTime: startDateTime,
          endTime: endDateTime,
          engineerId: assignedEngineer.id,
          engineerName: assignedEngineer.name,
          workOrderId: workOrderId,
          status: 'scheduled' as const,
          priority: newWorkOrder.priority as 'low' | 'medium' | 'high' | 'urgent',
          location: newWorkOrder.location,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const scheduleId = await addSchedule(scheduleData);
        console.log('✅ 対応するスケジュールが作成されました:', scheduleId);
      }

      // 作業指示一覧を再取得
      const updatedFirestoreWorkOrders = await getWorkOrders();
      const updatedConvertedWorkOrders: WorkOrder[] = updatedFirestoreWorkOrders.map(firestoreWorkOrder => ({
        id: parseInt(firestoreWorkOrder.id) || 0,
        title: firestoreWorkOrder.title,
        description: firestoreWorkOrder.description,
        location: firestoreWorkOrder.location,
        priority: firestoreWorkOrder.priority,
        status: firestoreWorkOrder.status,
        assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
        estimatedDuration: firestoreWorkOrder.estimatedDuration,
        actualDuration: firestoreWorkOrder.actualDuration,
        createdAt: firestoreWorkOrder.createdAt,
        updatedAt: firestoreWorkOrder.updatedAt,
        dueDate: firestoreWorkOrder.dueDate,
        firebaseId: firestoreWorkOrder.id
      }));
      
      setWorkOrdersList(updatedConvertedWorkOrders);
      
      // フォームをリセット
      setNewWorkOrder({
        title: '',
        description: '',
        location: '',
        priority: 'medium',
        estimatedDuration: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        customerName: '',
        customerPhone: '',
        assignedEngineerId: 'unassigned'
      });
      setValidationErrors({});
      setIsNewWorkOrderOpen(false);
      setRecommendedEngineers([]);
    } catch (err) {
      console.error('❌ 作業指示作成エラー:', err);
      setError(`作業指示の作成に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  // 作業開始
  const handleStartWork = async (workOrderId: number) => {
    try {
      const workOrder = workOrdersList.find(wo => wo.id === workOrderId);
      if (!workOrder || !workOrder.firebaseId) return;

      // 作業指示のステータスを更新
      await updateWorkOrder(workOrder.firebaseId, {
        status: 'in_progress'
      });

      // 対応するスケジュールのステータスも更新
      const schedules = await getSchedules();
      const relatedSchedule = schedules.find(schedule => schedule.workOrderId === workOrder.firebaseId);
      if (relatedSchedule) {
        await updateSchedule(relatedSchedule.id, {
          status: 'in_progress'
        });
        console.log('✅ 対応するスケジュールのステータスも更新されました:', relatedSchedule.id);
      }

      // データを再取得
      const updatedWorkOrders = await getWorkOrders();
      const convertedWorkOrders: WorkOrder[] = updatedWorkOrders.map(firestoreWorkOrder => ({
        id: parseInt(firestoreWorkOrder.id) || 0,
        title: firestoreWorkOrder.title,
        description: firestoreWorkOrder.description,
        location: firestoreWorkOrder.location,
        priority: firestoreWorkOrder.priority,
        status: firestoreWorkOrder.status,
        assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
        estimatedDuration: firestoreWorkOrder.estimatedDuration,
        actualDuration: firestoreWorkOrder.actualDuration,
        createdAt: firestoreWorkOrder.createdAt,
        updatedAt: firestoreWorkOrder.updatedAt,
        dueDate: firestoreWorkOrder.dueDate,
        firebaseId: firestoreWorkOrder.id
      }));
      setWorkOrdersList(convertedWorkOrders);
    } catch (error) {
      console.error('作業開始エラー:', error);
    }
  };

  // 作業完了
  const handleCompleteWork = async (workOrderId: number) => {
    try {
      const workOrder = workOrdersList.find(wo => wo.id === workOrderId);
      if (!workOrder || !workOrder.firebaseId) return;

      // 作業指示のステータスを更新
      await updateWorkOrder(workOrder.firebaseId, {
        status: 'completed'
      });

      // 対応するスケジュールのステータスも更新
      const schedules = await getSchedules();
      const relatedSchedule = schedules.find(schedule => schedule.workOrderId === workOrder.firebaseId);
      if (relatedSchedule) {
        await updateSchedule(relatedSchedule.id, {
          status: 'completed'
        });
        console.log('✅ 対応するスケジュールのステータスも更新されました:', relatedSchedule.id);
      }

      // データを再取得
      const updatedWorkOrders = await getWorkOrders();
      const convertedWorkOrders: WorkOrder[] = updatedWorkOrders.map(firestoreWorkOrder => ({
        id: parseInt(firestoreWorkOrder.id) || 0,
        title: firestoreWorkOrder.title,
        description: firestoreWorkOrder.description,
        location: firestoreWorkOrder.location,
        priority: firestoreWorkOrder.priority,
        status: firestoreWorkOrder.status,
        assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
        estimatedDuration: firestoreWorkOrder.estimatedDuration,
        actualDuration: firestoreWorkOrder.actualDuration,
        createdAt: firestoreWorkOrder.createdAt,
        updatedAt: firestoreWorkOrder.updatedAt,
        dueDate: firestoreWorkOrder.dueDate,
        firebaseId: firestoreWorkOrder.id
      }));
      setWorkOrdersList(convertedWorkOrders);
    } catch (error) {
      console.error('作業完了エラー:', error);
    }
  };

  const openAssignDialog = (workOrder: UnifiedItem) => {
    setSelectedWorkOrder(workOrder);
    setIsAssignDialogOpen(true);
  };

  const openEngineerDetails = (engineer: Engineer) => {
    console.log('エンジニア詳細:', engineer);
  };

  // エンジニアレコメンド機能（Firebaseのエンジニアデータを使用）
  const getRecommendedEngineers = (dueDate: string) => {
    if (!dueDate) {
      setRecommendedEngineers([]);
      return;
    }

    // 期限日時に空いているエンジニアを取得（Firebaseから取得したエンジニアを使用）
    const availableEngineers = firebaseEngineers.filter(engineer => {
      // アクティブなエンジニアを対象
      return engineer.status === 'active';
    });

    // 優先度に基づいてソート（案件数が少ないエンジニアを優先）
    const sortedEngineers = availableEngineers.sort((a, b) => {
      return (a.totalProjects || 0) - (b.totalProjects || 0);
    });

    setRecommendedEngineers(sortedEngineers.slice(0, 3)); // 上位3名をレコメンド
  };

  // 開始日の変更ハンドラー
  const handleStartDateChange = (startDate: string) => {
    setNewWorkOrder({...newWorkOrder, startDate});
    if (startDate) {
      getRecommendedEngineers(startDate);
    }
  };

  // 開始時間の変更ハンドラー
  const handleStartTimeChange = (startTime: string) => {
    setNewWorkOrder({...newWorkOrder, startTime});
    if (newWorkOrder.startDate && startTime) {
      getRecommendedEngineers(newWorkOrder.startDate);
    }
  };

  // 終了日の変更ハンドラー
  const handleEndDateChange = (endDate: string) => {
    setNewWorkOrder({...newWorkOrder, endDate});
    if (endDate) {
      getRecommendedEngineers(endDate);
    }
  };


  // 終了時間の変更ハンドラー
  const handleEndTimeChange = (endTime: string) => {
    setNewWorkOrder({...newWorkOrder, endTime});
    if (newWorkOrder.endDate && endTime) {
      getRecommendedEngineers(newWorkOrder.endDate);
    }
  };

  // エンジニア割り当てハンドラー
  const handleAssignEngineer = async (workOrderId: string, engineerId: string) => {
    try {
      const engineer = firebaseEngineers.find(e => e.id === engineerId);
      if (!engineer) return;

      // 作業指示を更新
      await updateWorkOrder(workOrderId, {
        engineerId: engineerId,
        engineerName: engineer.name,
        status: 'assigned'
      });

      // 対応するスケジュールを作成（開始日時と終了日時がある場合）
      const workOrder = workOrdersList.find(wo => wo.firebaseId === workOrderId);
      if (workOrder && workOrder.dueDate) {
        const startDateTime = new Date(workOrder.dueDate);
        startDateTime.setHours(9, 0, 0, 0); // デフォルトで9:00開始
        
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + Math.ceil(workOrder.estimatedDuration / 60), 0, 0, 0); // 予想時間分追加
        
        const scheduleData = {
          title: workOrder.title,
          description: workOrder.description,
          startTime: startDateTime,
          endTime: endDateTime,
          engineerId: engineerId,
          engineerName: engineer.name,
          workOrderId: workOrderId,
          status: 'scheduled' as const,
          priority: workOrder.priority,
          location: workOrder.location,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const scheduleId = await addSchedule(scheduleData);
        console.log('✅ エンジニア割り当て時にスケジュールが作成されました:', scheduleId);
      }

      // データを再取得
      const updatedWorkOrders = await getWorkOrders();
      const convertedWorkOrders: WorkOrder[] = updatedWorkOrders.map(firestoreWorkOrder => ({
        id: parseInt(firestoreWorkOrder.id) || 0,
        title: firestoreWorkOrder.title,
        description: firestoreWorkOrder.description,
        location: firestoreWorkOrder.location,
        priority: firestoreWorkOrder.priority,
        status: firestoreWorkOrder.status,
        assignedEngineerId: firestoreWorkOrder.engineerId ? parseInt(firestoreWorkOrder.engineerId) : undefined,
        estimatedDuration: firestoreWorkOrder.estimatedDuration,
        actualDuration: firestoreWorkOrder.actualDuration,
        createdAt: firestoreWorkOrder.createdAt,
        updatedAt: firestoreWorkOrder.updatedAt,
        dueDate: firestoreWorkOrder.dueDate,
        firebaseId: firestoreWorkOrder.id
      }));
      setWorkOrdersList(convertedWorkOrders);
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error('エンジニア割り当てエラー:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 font-medium">エラー</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* ローディング表示 */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">データを読み込み中...</span>
          </div>
        </div>
      )}
      
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
                <div className="grid gap-1.5">
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
                <div className="grid gap-1.5">
                  <Label htmlFor="engineer-filter">エンジニア</Label>
                  <Select value={filters.engineer} onValueChange={(value) => setFilters({...filters, engineer: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {firebaseEngineers.map(engineer => (
                        <SelectItem key={engineer.id} value={engineer.id.toString()}>
                          {engineer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
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
          <Dialog open={isNewWorkOrderOpen} onOpenChange={(open) => {
            setIsNewWorkOrderOpen(open);
            if (open) {
              // ダイアログが開かれた時に推奨エンジニアを取得
              const today = new Date().toISOString().split('T')[0];
              getRecommendedEngineers(today);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新規作業指示
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新規作業指示</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={newWorkOrder.title}
                    onChange={(e) => {
                      setNewWorkOrder({...newWorkOrder, title: e.target.value});
                      // バリデーションエラーをクリア
                      if (validationErrors.title) {
                        setValidationErrors({...validationErrors, title: ''});
                      }
                    }}
                    placeholder="作業指示のタイトル"
                    className={validationErrors.title ? 'border-red-500' : ''}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="description">詳細 <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    value={newWorkOrder.description}
                    onChange={(e) => {
                      setNewWorkOrder({...newWorkOrder, description: e.target.value});
                      // バリデーションエラーをクリア
                      if (validationErrors.description) {
                        setValidationErrors({...validationErrors, description: ''});
                      }
                    }}
                    placeholder="作業内容の詳細"
                    rows={3}
                    className={validationErrors.description ? 'border-red-500' : ''}
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-500">{validationErrors.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="location">場所 <span className="text-red-500">*</span></Label>
                    <Input
                      id="location"
                      value={newWorkOrder.location}
                      onChange={(e) => {
                        setNewWorkOrder({...newWorkOrder, location: e.target.value});
                        // バリデーションエラーをクリア
                        if (validationErrors.location) {
                          setValidationErrors({...validationErrors, location: ''});
                        }
                      }}
                      placeholder="作業場所"
                      className={validationErrors.location ? 'border-red-500' : ''}
                    />
                    {validationErrors.location && (
                      <p className="text-sm text-red-500">{validationErrors.location}</p>
                    )}
                  </div>
                  <div className="grid gap-1.5">
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
                <div className="grid gap-1.5">
                  <Label htmlFor="assignedEngineer">担当エンジニア</Label>
                  <Select value={newWorkOrder.assignedEngineerId} onValueChange={(value) => setNewWorkOrder({...newWorkOrder, assignedEngineerId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="エンジニアを選択（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">未割り当て</SelectItem>
                      {firebaseEngineers.map(engineer => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="duration">予想時間（分）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newWorkOrder.estimatedDuration}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, estimatedDuration: e.target.value})}
                      placeholder="60"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="startDate">開始日</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newWorkOrder.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="endDate">終了日</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newWorkOrder.endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="startTime">開始時間</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newWorkOrder.startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="endTime">終了時間</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newWorkOrder.endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="customerName">顧客名</Label>
                    <Input
                      id="customerName"
                      value={newWorkOrder.customerName}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, customerName: e.target.value})}
                      placeholder="顧客名"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="customerPhone">顧客電話</Label>
                    <Input
                      id="customerPhone"
                      value={newWorkOrder.customerPhone}
                      onChange={(e) => setNewWorkOrder({...newWorkOrder, customerPhone: e.target.value})}
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>
                
                {/* レコメンドエンジニア */}
                {recommendedEngineers.length > 0 && (
                  <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">推奨エンジニア</Label>
                    <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                      {recommendedEngineers.map(engineer => (
                        <div key={engineer.id} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {engineer.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{engineer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {engineer.departmentId === 1 ? '技術部' : '保守部'} • 
                              {engineer.status === 'active' ? '稼働中' : '待機中'}
                            </p>
                          </div>
                          <Badge className={`text-xs px-1 py-0 ${
                            engineer.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {engineer.status === 'active' ? '推奨' : '稼働中'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      期限日時に空いているエンジニアを表示しています
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
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
          <Badge variant="outline" className="border-red-200 text-red-700">緊急: {filteredWorkOrders.filter(item => item.priority === 'urgent').length}件</Badge>
          <Badge variant="outline" className="border-orange-200 text-orange-700">高: {filteredWorkOrders.filter(item => item.priority === 'high').length}件</Badge>
          <Badge variant="outline" className="border-yellow-200 text-yellow-700">中: {filteredWorkOrders.filter(item => item.priority === 'medium').length}件</Badge>
          <Badge variant="outline" className="border-gray-200 text-gray-700">低: {filteredWorkOrders.filter(item => item.priority === 'low').length}件</Badge>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">エンジニア:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700">稼働中: {firebaseEngineers.filter(e => e.status === 'active').length}人</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">待機: {firebaseEngineers.filter(e => e.status === 'available').length}人</Badge>
        </div>
      </div>

      {/* データが空の場合の表示 */}
      {!loading && !error && filteredWorkOrders.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-2">
            <Clipboard className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium">作業指示がありません</h3>
            <p className="text-sm">新しい作業指示を作成してください</p>
          </div>
        </div>
      )}
      
      {/* カンバンボードメインエリア */}
      {!loading && !error && filteredWorkOrders.length > 0 && (
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
                  <h4 className="font-medium text-sm mb-1">
                    {workOrder.title}
                    {workOrder.type === 'schedule' && (
                      <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">スケジュール</Badge>
                    )}
                    {workOrder.type === 'workOrder' && (
                      <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">作業指示</Badge>
                    )}
                  </h4>
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
                      <span>{workOrder.type === 'workOrder' ? `${workOrder.estimatedDuration}分` : 'スケジュール'}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      workOrder.type === 'workOrder' && workOrder.dueDate && isOverdue(workOrder.dueDate) ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        {workOrder.type === 'workOrder' 
                          ? (workOrder.dueDate ? formatDate(workOrder.dueDate) : '未設定')
                          : formatDate(new Date(workOrder.startDate))
                        }
                      </span>
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
                const assignedEngineer = workOrder.type === 'workOrder' 
                  ? firebaseEngineers.find(e => e.id === workOrder.assignedEngineerId?.toString())
                  : firebaseEngineers.find(e => e.id === workOrder.engineerId);
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
                    <h4 className="font-medium text-sm mb-1">
                      {workOrder.title}
                      {workOrder.type === 'schedule' && (
                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">スケジュール</Badge>
                      )}
                      {workOrder.type === 'workOrder' && (
                        <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">作業指示</Badge>
                      )}
                    </h4>
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
                const assignedEngineer = workOrder.type === 'workOrder' 
                  ? firebaseEngineers.find(e => e.id === workOrder.assignedEngineerId?.toString())
                  : firebaseEngineers.find(e => e.id === workOrder.engineerId);
                return (
                  <div key={workOrder.id} className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                    {/* 進行中表示 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-orange-700">進行中</span>
                      <Badge className="ml-auto text-xs bg-orange-100 text-orange-700">
                        {workOrder.type === 'workOrder' 
                          ? (assignedEngineer?.name || '不明')
                          : (workOrder.engineerName || '不明')
                        }
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">
                      {workOrder.title}
                      {workOrder.type === 'schedule' && (
                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">スケジュール</Badge>
                      )}
                      {workOrder.type === 'workOrder' && (
                        <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">作業指示</Badge>
                      )}
                    </h4>
                    
                    {/* 進捗バー */}
                    {workOrder.type === 'workOrder' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>進捗</span>
                          <span>{workOrder.progress || 0}%</span>
                        </div>
                        <Progress value={workOrder.progress || 0} className="h-2" />
                      </div>
                    )}
                    
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
                const assignedEngineer = workOrder.type === 'workOrder' 
                  ? firebaseEngineers.find(e => e.id === workOrder.assignedEngineerId?.toString())
                  : firebaseEngineers.find(e => e.id === workOrder.engineerId);
                return (
                  <div key={workOrder.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">完了</span>
                      <Badge className="ml-auto text-xs bg-green-100 text-green-700">
                        {workOrder.type === 'workOrder' && workOrder.completedAt 
                          ? formatTime(workOrder.completedAt) 
                          : '完了'
                        }
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">
                      {workOrder.title}
                      {workOrder.type === 'schedule' && (
                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">スケジュール</Badge>
                      )}
                      {workOrder.type === 'workOrder' && (
                        <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">作業指示</Badge>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      担当: {workOrder.type === 'workOrder' 
                        ? (assignedEngineer?.name || '不明')
                        : (workOrder.engineerName || '不明')
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* エンジニア状況セクション（下部） */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4">エンジニア状況</h3>
          
          {/* エンジニア統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{firebaseEngineers.length}</p>
                  <p className="text-sm text-blue-600">総エンジニア数</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-orange-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {firebaseEngineers.filter((e: Engineer) => e.status === 'busy').length}
                  </p>
                  <p className="text-sm text-orange-600">作業中</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {firebaseEngineers.filter((e: Engineer) => e.status === 'available').length}
                  </p>
                  <p className="text-sm text-green-600">待機中</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-purple-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {firebaseEngineers.filter((e: Engineer) => e.status === 'on_leave').length}
                  </p>
                  <p className="text-sm text-purple-600">休暇中</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto">
            {firebaseEngineers.map(engineer => (
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
                      {engineerStatusLabels[engineer.status as keyof typeof engineerStatusLabels]}
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
                  {firebaseEngineers.filter((e: Engineer) => e.status === 'available' || e.status === 'active').map((engineer: Engineer) => (
                    <div 
                      key={engineer.id}
                      className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAssignEngineer(selectedWorkOrder?.firebaseId || selectedWorkOrder?.id.toString() || '', engineer.id)}
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
                        {engineerStatusLabels[engineer.status as keyof typeof engineerStatusLabels]}
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
