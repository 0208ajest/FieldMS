'use client';

import { useMemo, useState } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import NotificationSystem from '@/components/NotificationSystem';
import ProfileDialog from '@/components/ProfileDialog';
import { Clipboard, Home as HomeIcon, Users as UsersIcon, Calendar as CalendarIcon, UserCog, Settings, HelpCircle } from 'lucide-react';
import { User } from '@/types';
import { demoLoginCredentials } from '@/components/data/userData';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import EngineerManagement from '@/components/EngineerManagement';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import DispatchBoard from '@/components/DispatchBoard';
import UserManagement from '@/components/UserManagement';
import SettingsPage from '@/components/SettingsPage';

type View = 'dashboard' | 'engineers' | 'schedule' | 'dispatch' | 'users' | 'settings';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [engineerFilter, setEngineerFilter] = useState<number | null>(null);

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
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon" className="w-64 group-data-[collapsible=icon]:w-16">
        <SidebarHeader className="p-4 border-b h-15">
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
        <SidebarContent className="flex-1 overflow-y-auto">
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* 設定・ヘルプセクション */}
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

      <main className="flex-1 flex flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 gap-4">
            <SidebarTrigger className="w-6 h-6" />
            <div className="flex-1" />
            <NotificationSystem onNavigateToSchedule={(engineerId) => {
              setEngineerFilter(engineerId || null);
              setActiveView('schedule');
            }} />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser?.name || 'ユーザー'}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.systemRole || '不明'}</p>
              </div>
              <ProfileDialog 
                currentUser={currentUser} 
                onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {activeView === 'dashboard' && (
            <Dashboard onNavigateToDispatch={() => setActiveView('dispatch')} />
          )}
          {activeView === 'engineers' && currentUser && (
            <EngineerManagement 
              currentUser={currentUser} 
              onNavigateToSchedule={(engineerId) => {
                setEngineerFilter(engineerId || null);
                setActiveView('schedule');
              }} 
            />
          )}
          {activeView === 'schedule' && currentUser && (
            <ScheduleCalendar 
              currentUser={currentUser} 
              engineerFilter={engineerFilter} 
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
      </div>
    </SidebarProvider>
  );
}
