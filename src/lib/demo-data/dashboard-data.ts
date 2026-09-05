export interface DashboardData {
  user: {
    name: string;
    greeting: string;
    role: string;
    initials: string;
    unreadNotifications: number;
  };
  kpis: {
    todayVehicles: {
      count: number;
      label: string;
      linkText: string;
      href: string;
    };
    pendingQuotes: {
      count: number;
      label: string;
      linkText: string;
      href: string;
    };
    weeklyCapacity: {
      percentage: number;
      detail: string;
      linkText: string;
      href: string;
    };
    criticalStock: {
      count: number;
      label: string;
      linkText: string;
      href: string;
    };
    todayDeliveries: {
      count: number;
      label: string;
      linkText: string;
      href: string;
    };
  };
  activeWorks: Array<{
    id: string;
    vehicle: string;
    service: string;
    status: "Em Curso" | "A Guardar Peças" | "Concluído";
    technician: string;
    startTime: string;
    progress: number;
    avatarUrl?: string;
  }>;
  todayAgenda: Array<{
    id: string;
    time: string;
    vehicle: string;
    service: string;
    technician: string;
    status: "completed" | "in_progress" | "scheduled";
  }>;
  intelligenceAlerts: Array<{
    id: string;
    severity: "danger" | "warning" | "info";
    title: string;
    subtitle: string;
    href: string;
  }>;
  metrics: {
    monthlyRevenue: {
      value: number;
      changePercentage: number;
      comparisonText: string;
      sparkline: number[];
    };
    estimatedMargin: {
      value: number;
      changePercentage: number;
      marginRate: number;
      sparkline: number[];
    };
    occupancyRate: {
      percentage: number;
      changePercentage: number;
      hoursDetail: string;
      barChart: number[];
    };
    customerSatisfaction: {
      score: number;
      maxScore: number;
      changeScore: number;
      reviewsCount: number;
      stars: number;
    };
  };
}

export const initialDashboardData: DashboardData = {
  user: {
    greeting: "Olá, Luís",
    name: "Luís Gonçalves",
    role: "Gestor",
    initials: "LG",
    unreadNotifications: 3,
  },
  kpis: {
    todayVehicles: {
      count: 4,
      label: "Viaturas",
      linkText: "Ver detalhes",
      href: "/vehicles",
    },
    pendingQuotes: {
      count: 7,
      label: "Total",
      linkText: "Ver orçamentos",
      href: "/quotes",
    },
    weeklyCapacity: {
      percentage: 76,
      detail: "30 de 40 horas",
      linkText: "Ver calendário",
      href: "/calendar",
    },
    criticalStock: {
      count: 5,
      label: "Itens",
      linkText: "Ver stock",
      href: "/inventory",
    },
    todayDeliveries: {
      count: 2,
      label: "Viaturas",
      linkText: "Ver entregas",
      href: "/deliveries",
    },
  },
  activeWorks: [
    {
      id: "w1",
      vehicle: "BMW M4",
      service: "PPF Completo",
      status: "Em Curso",
      technician: "João Martins",
      startTime: "10:00",
      progress: 65,
    },
    {
      id: "w2",
      vehicle: "Porsche 911 Carrera",
      service: "Wrap",
      status: "Em Curso",
      technician: "Rui Almeida",
      startTime: "12:00",
      progress: 40,
    },
    {
      id: "w3",
      vehicle: "Audi RS6 Avant",
      service: "PPF Frontal",
      status: "Em Curso",
      technician: "Pedro Santos",
      startTime: "09:00",
      progress: 75,
    },
    {
      id: "w4",
      vehicle: "Mercedes GLC",
      service: "Chrome Delete",
      status: "A Guardar Peças",
      technician: "Miguel Costa",
      startTime: "14:00",
      progress: 20,
    },
  ],
  todayAgenda: [
    {
      id: "a1",
      time: "09:00",
      vehicle: "BMW M4",
      service: "PPF Completo",
      technician: "João Martins",
      status: "in_progress",
    },
    {
      id: "a2",
      time: "10:00",
      vehicle: "Porsche 911 Carrera",
      service: "Wrap",
      technician: "Rui Almeida",
      status: "completed",
    },
    {
      id: "a3",
      time: "12:00",
      vehicle: "Audi RS6 Avant",
      service: "PPF Frontal",
      technician: "Pedro Santos",
      status: "in_progress",
    },
    {
      id: "a4",
      time: "14:00",
      vehicle: "Mercedes GLC",
      service: "Chrome Delete",
      technician: "Miguel Costa",
      status: "in_progress",
    },
    {
      id: "a5",
      time: "16:00",
      vehicle: "Tesla Model 3",
      service: "Detailing Interior",
      technician: "Ana Ferreira",
      status: "scheduled",
    },
    {
      id: "a6",
      time: "17:30",
      vehicle: "Entregas de Hoje",
      service: "6 viaturas previstas",
      technician: "",
      status: "scheduled",
    },
  ],
  intelligenceAlerts: [
    {
      id: "i1",
      severity: "danger",
      title: "Material insuficiente para o trabalho de segunda-feira",
      subtitle: "3 itens críticos em falta",
      href: "/inventory",
    },
    {
      id: "i2",
      severity: "warning",
      title: "3 orçamentos aguardam resposta há mais de 4 dias",
      subtitle: "Valor total: € 9.450",
      href: "/quotes",
    },
    {
      id: "i3",
      severity: "warning",
      title: "O BMW M4 está 2 horas acima do previsto",
      subtitle: "Nova previsão: 12:00",
      href: "/work-orders/1",
    },
  ],
  metrics: {
    monthlyRevenue: {
      value: 24850,
      changePercentage: 18,
      comparisonText: "vs mês anterior",
      sparkline: [17500, 18900, 20400, 21800, 23600, 24850],
    },
    estimatedMargin: {
      value: 9420,
      changePercentage: 14,
      marginRate: 37.9,
      sparkline: [6900, 7500, 8100, 8500, 9100, 9420],
    },
    occupancyRate: {
      percentage: 76,
      changePercentage: 9,
      hoursDetail: "30 de 40 horas",
      barChart: [45, 55, 60, 50, 68, 75, 70, 82, 78, 88, 85, 76],
    },
    customerSatisfaction: {
      score: 4.8,
      maxScore: 5,
      changeScore: 0.3,
      reviewsCount: 64,
      stars: 5,
    },
  },
};
