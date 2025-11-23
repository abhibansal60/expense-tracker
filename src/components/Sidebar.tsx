import {
    Filter,
    Settings,
    UploadCloud,
    X,
    LogOut,
} from 'lucide-react';
import { useHouseholdUser } from './HouseholdUserGate';
import type { TrackerView } from './ExpenseTracker';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    filtersActive: boolean;
    onToggleFilters: () => void;
    onOpenSettings: () => void;
    activeView: TrackerView;
    onChangeView: (view: TrackerView) => void;
}

export function Sidebar({
    isOpen,
    onClose,
    filtersActive,
    onToggleFilters,
    onOpenSettings,
    activeView,
    onChangeView,
}: SidebarProps) {
    const { user, clearUser } = useHouseholdUser();
    const displayName = user.name;

    const menuItems = [
        {
            id: 'import',
            label: 'Bridge',
            icon: UploadCloud,
            action: () => onChangeView('import'),
            isActive: activeView === 'import',
        },
        {
            id: 'filters',
            label: 'Filters',
            icon: Filter,
            action: onToggleFilters,
            isActive: filtersActive,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            action: onOpenSettings,
            isActive: false,
        },
        {
            id: 'sign-out',
            label: 'Sign out',
            icon: LogOut,
            action: clearUser,
            isActive: false,
            variant: 'destructive' as const,
        },
    ];

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
                onClick={onClose}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-[min(90vw,360px)] translate-x-0 bg-popover text-popover-foreground shadow-2xl ring-1 ring-border/70 transition-transform animate-in slide-in-from-right">
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Signed in as</p>
                        <p className="text-base font-semibold text-foreground">{displayName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/30 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-4 px-4 py-4">
                    <div className="space-y-2">
                        <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick actions</p>
                        <ul className="user-menu__list">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isDestructive = item.variant === 'destructive';
                                const isActive = item.isActive;
                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                item.action();
                                                onClose();
                                            }}
                                            className={`user-menu__item ${isActive ? 'user-menu__item--active' : ''
                                                } ${isDestructive ? 'user-menu__item--danger' : ''}`}
                                            aria-current={isActive ? 'true' : undefined}
                                        >
                                            <span className="user-menu__icon" aria-hidden>
                                                <Icon size={16} />
                                            </span>
                                            <span className="user-menu__label">{item.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </aside>
        </>
    );
}
