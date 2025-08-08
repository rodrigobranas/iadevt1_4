import { SimpleSidebar } from '@/components/simple-sidebar';
import { ThemeSwitcher } from '@/components/ui/kibo-ui/theme-switcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { KanbanPage } from '@/features/kanban/KanbanPage';

export default function App() {
  return (
    <SidebarProvider>
      <SimpleSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Kanban Board</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4">
            <ThemeSwitcher />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <KanbanPage />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
