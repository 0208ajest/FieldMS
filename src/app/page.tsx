'use client';

import { useMemo, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import NotificationSystem from '@/components/NotificationSystem';
import ProfileDialog from '@/components/ProfileDialog';
import { Clipboard, Home as HomeIcon, Users as UsersIcon, Calendar as CalendarIcon, UserCog, Settings, HelpCircle, LogOut } from 'lucide-react';
import { User } from '@/types';
import { demoLoginCredentials } from '@/components/data/userData';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import EngineerManagement from '@/components/EngineerManagement';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import DispatchBoard from '@/components/DispatchBoard';
import UserManagement from '@/components/UserManagement';
import SettingsPage from '@/components/SettingsPage';
import { APP_CONFIG } from '@/lib/config';
import { FirebaseAuthProvider, useFirebaseAuth } from '@/components/FirebaseAuthProvider';
import FirebaseLoginForm from '@/components/FirebaseLoginForm';
import { logout } from '@/lib/auth';
import { getCompany } from '@/lib/firestore';

type View = 'dashboard' | 'engineers' | 'schedule' | 'dispatch' | 'users' | 'settings';

interface MainContentProps {
  currentUser: User | null;
  activeView: View;
  engineerFilter: number | null;
  setActiveView: (view: View) => void;
  setEngineerFilter: (filter: number | null) => void;
  setCurrentUser: (user: User) => void;
  companyName: string;
}

function MainContent({ 
  currentUser, 
  activeView, 
  engineerFilter, 
  setActiveView, 
  setEngineerFilter, 
  setCurrentUser,
  companyName
}: MainContentProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  return (
    <main className={`flex-1 flex flex-col transition-[margin-left] duration-200 ease-linear ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <SidebarTrigger className="w-6 h-6" />
          <div className="flex-1" />
          <NotificationSystem 
            onNavigateToDispatch={() => {
              setActiveView('dispatch');
            }}
            onNavigateToSchedule={(scheduleId, engineerId) => {
              // scheduleIdが文字列の場合は数値に変換
              const numericEngineerId = typeof engineerId === 'string' ? parseInt(engineerId) : engineerId;
              setEngineerFilter(numericEngineerId || null);
              setActiveView('schedule');
            }} 
          />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser?.name || 'ユーザー'}</p>
              <p className="text-xs text-muted-foreground">
                {companyName || currentUser?.systemRole || '不明'}
              </p>
            </div>
            {currentUser && (
              <ProfileDialog 
                currentUser={currentUser} 
                onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-auto bg-background">
        {activeView === 'dashboard' && (
          <Dashboard 
            onNavigateToDispatch={() => setActiveView('dispatch')} 
            currentUser={currentUser ? { name: currentUser.name, companyId: currentUser.companyId } : undefined}
          />
        )}
        {activeView === 'engineers' && currentUser && (
          <EngineerManagement currentUser={currentUser} />
        )}
        {activeView === 'schedule' && currentUser && (
          <ScheduleCalendar 
            currentUser={currentUser} 
            engineerFilter={engineerFilter?.toString() || null}
          />
        )}
        {activeView === 'dispatch' && currentUser && (
          <DispatchBoard currentUser={currentUser} />
        )}
        {activeView === 'users' && currentUser && (
          <UserManagement currentUser={currentUser} />
        )}
        {activeView === 'settings' && (
          <SettingsPage />
        )}
      </div>
    </main>
  );
}

// Firebase認証を使用するコンポーネント
function FirebaseAuthenticatedApp() {
  const { user: firestoreUser, loading, isAuthenticated } = useFirebaseAuth();
  const [activeView, setActiveView] = useState<View>(() => {
    // ローカルストレージから前回のビューを復元
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('fieldms-active-view');
      return (savedView as View) || 'dashboard';
    }
    return 'dashboard';
  });
  const [engineerFilter, setEngineerFilter] = useState<number | null>(() => {
    // ローカルストレージから前回のエンジニアフィルターを復元
    if (typeof window !== 'undefined') {
      const savedFilter = localStorage.getItem('fieldms-engineer-filter');
      return savedFilter ? parseInt(savedFilter) : null;
    }
    return null;
  });
  const [companyName, setCompanyName] = useState<string>('');

  // FirestoreUserを既存のUser型に変換
  const currentUser: User | null = useMemo(() => {
    return firestoreUser ? {
      id: firestoreUser.id,
      name: firestoreUser.name,
      email: firestoreUser.email,
      phone: firestoreUser.phone,
      systemRole: firestoreUser.systemRole,
      companyId: parseInt(firestoreUser.companyId) || 1,
      departmentId: parseInt(firestoreUser.departmentId) || 1,
      isActive: firestoreUser.isActive,
      avatar: firestoreUser.avatar,
      bio: firestoreUser.bio,
      createdAt: firestoreUser.createdAt,
      lastLoginAt: firestoreUser.lastLoginAt,
    } : null;
  }, [firestoreUser]);

  // 状態変更時にローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldms-active-view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (engineerFilter !== null) {
        localStorage.setItem('fieldms-engineer-filter', engineerFilter.toString());
      } else {
        localStorage.removeItem('fieldms-engineer-filter');
      }
    }
  }, [engineerFilter]);

  // 企業名を取得
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (currentUser?.companyId) {
        try {
          const company = await getCompany(currentUser.companyId.toString());
          if (company && company.name) {
            setCompanyName(company.name);
          }
        } catch (error) {
          console.error('企業名取得エラー:', error);
        }
      }
    };

    fetchCompanyName();
  }, [currentUser?.companyId]);

  const handleLogout = async () => {
    try {
      await logout();
      // ログアウト時にローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fieldms-active-view');
        localStorage.removeItem('fieldms-engineer-filter');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setCurrentUser = (user: User) => {
    // Firebase認証では直接ユーザーを設定しない
    console.log('User updated:', user);
  };

  const canSeeUserManagement = useMemo(() => {
    return currentUser ? currentUser.systemRole === 'system_admin' : false;
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    console.log('FirebaseAuthenticatedApp: Not authenticated or no current user', { 
      isAuthenticated, 
      currentUser: currentUser ? 'User exists' : 'No user',
      firestoreUser: firestoreUser ? 'FirestoreUser exists' : 'No FirestoreUser'
    });
    return <FirebaseLoginForm onLoginSuccess={() => {
      console.log('Login success callback called - forcing re-render');
    }} />;
  }

  console.log('FirebaseAuthenticatedApp: User authenticated, rendering main app', { 
    userName: currentUser.name,
    userRole: currentUser.systemRole 
  });

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="w-64 group-data-[collapsible=icon]:w-16 border-r bg-sidebar shadow-sm">
        <SidebarHeader className="p-4 border-b h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Clipboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="font-semibold text-sm">FieldMS</h2>
              <p className="text-xs text-muted-foreground">フィールドマネジメント</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto bg-sidebar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} className="w-full h-10 px-3 rounded-md">
                    <HomeIcon className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ダッシュボード</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'schedule'} onClick={() => setActiveView('schedule')} className="w-full h-10 px-3 rounded-md">
                    <CalendarIcon className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">スケジュール</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'dispatch'} onClick={() => setActiveView('dispatch')} className="w-full h-10 px-3 rounded-md">
                    <Clipboard className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ディスパッチ</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canSeeUserManagement && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'users'} onClick={() => setActiveView('users')} className="w-full h-10 px-3 rounded-md">
                      <UserCog className="w-4 h-4 mr-3" />
                      <span className="group-data-[collapsible=icon]:hidden">ユーザー管理</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canSeeUserManagement && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'engineers'} onClick={() => setActiveView('engineers')} className="w-full h-10 px-3 rounded-md">
                      <UsersIcon className="w-4 h-4 mr-3" />
                      <span className="group-data-[collapsible=icon]:hidden">エンジニア管理</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* 設定・ヘルプ・ログアウトセクション */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} className="w-full h-10 px-3 rounded-md">
                    <Settings className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">設定</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => window.open('https://help.fieldms.com', '_blank')} 
                    className="w-full h-10 px-3 rounded-md"
                  >
                    <HelpCircle className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ヘルプ</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout} 
                    className="w-full h-10 px-3 rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ログアウト</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

          <MainContent 
            currentUser={currentUser}
            activeView={activeView}
            engineerFilter={engineerFilter}
            setActiveView={setActiveView}
            setEngineerFilter={setEngineerFilter}
            setCurrentUser={setCurrentUser}
            companyName={companyName}
          />
    </SidebarProvider>
  );
}

// 既存のモック認証を使用するコンポーネント
function MockAuthenticatedApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [engineerFilter, setEngineerFilter] = useState<number | null>(null);
  const [companyName] = useState<string>('');

  const canSeeUserManagement = useMemo(() => {
    return currentUser ? currentUser.systemRole === 'system_admin' : false;
  }, [currentUser]);

  if (!isAuthenticated || !currentUser) {
    const handleLogin = async (email: string, password: string): Promise<boolean> => {
      const found = demoLoginCredentials.find((d) => d.email === email && d.password === password);
      if (found) {
        setCurrentUser(found.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    };
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="w-64 group-data-[collapsible=icon]:w-16 border-r bg-sidebar shadow-sm">
        <SidebarHeader className="p-4 border-b h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Clipboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="font-semibold text-sm">FieldMS</h2>
              <p className="text-xs text-muted-foreground">フィールドマネジメント</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto bg-sidebar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} className="w-full h-10 px-3 rounded-md">
                    <HomeIcon className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ダッシュボード</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'engineers'} onClick={() => setActiveView('engineers')} className="w-full h-10 px-3 rounded-md">
                    <UsersIcon className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">エンジニア管理</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'schedule'} onClick={() => setActiveView('schedule')} className="w-full h-10 px-3 rounded-md">
                    <CalendarIcon className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">スケジュール</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'dispatch'} onClick={() => setActiveView('dispatch')} className="w-full h-10 px-3 rounded-md">
                    <UserCog className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ディスパッチボード</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canSeeUserManagement && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeView === 'users'} onClick={() => setActiveView('users')} className="w-full h-10 px-3 rounded-md">
                      <UsersIcon className="w-4 h-4 mr-3" />
                      <span className="group-data-[collapsible=icon]:hidden">ユーザー管理</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} className="w-full h-10 px-3 rounded-md">
                    <Settings className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">設定</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => window.open('https://help.fieldms.com', '_blank')} 
                    className="w-full h-10 px-3 rounded-md"
                  >
                    <HelpCircle className="w-4 h-4 mr-3" />
                    <span className="group-data-[collapsible=icon]:hidden">ヘルプ</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <MainContent 
        currentUser={currentUser} 
        activeView={activeView}
        engineerFilter={engineerFilter} 
        setActiveView={setActiveView}
        setEngineerFilter={setEngineerFilter}
        setCurrentUser={setCurrentUser}
        companyName={companyName}
      />
    </SidebarProvider>
  );
}

// メインのHomeコンポーネント - 設定に基づいて認証方式を選択
export default function Home() {
  if (APP_CONFIG.ENABLE_FIREBASE) {
    return (
      <FirebaseAuthProvider>
        <FirebaseAuthenticatedApp />
      </FirebaseAuthProvider>
    );
  }
  
  return <MockAuthenticatedApp />;
}
