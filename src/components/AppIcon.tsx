import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Code2,
  DatabaseBackup,
  ExternalLink,
  Eye,
  Focus,
  Footprints,
  Globe,
  History,
  Info,
  Languages,
  Landmark,
  LibraryBig,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Trees,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

const icons: Record<string, ComponentType<LucideProps>> = {
  account_circle: CircleUserRound,
  add: Plus,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  backup: DatabaseBackup,
  block: Ban,
  call: Phone,
  center_focus_strong: Focus,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  code: Code2,
  contact_support: CircleHelp,
  directions_walk: Footprints,
  edit: Pencil,
  history: History,
  history_edu: ScrollText,
  info: Info,
  language: Globe,
  library_books: LibraryBig,
  location_on: MapPin,
  logout: LogOut,
  map: Map,
  museum: Landmark,
  my_location: LocateFixed,
  open_in_new: ExternalLink,
  park: Trees,
  schedule: Clock3,
  search: Search,
  settings: Settings,
  auto_awesome: Sparkles,
  translate: Languages,
  visibility: Eye,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,
}

type Props = LucideProps & {
  name: string
}

export default function AppIcon({ name, className, ...props }: Props) {
  const Icon = icons[name] ?? Info
  return (
    <Icon
      className={['app-icon', className].filter(Boolean).join(' ')}
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  )
}
