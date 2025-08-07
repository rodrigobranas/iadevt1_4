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
                  <BreadcrumbPage>Tarefas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4">
            <ThemeSwitcher />
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4">
          <div className="bg-muted/50 flex min-h-[calc(100vh-5rem)] flex-1 items-center justify-center rounded-xl">
            <span className="text-muted-foreground text-lg">Área principal de conteúdo</span>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
