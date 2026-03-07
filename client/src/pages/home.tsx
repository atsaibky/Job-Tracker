import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { Prospect } from "@shared/schema";
import { STATUSES, INTEREST_LEVELS } from "@shared/schema";
import { filterByInterest, type InterestFilter } from "@shared/prospect-filters";
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

function KanbanColumn({
  status,
  prospects,
  isLoading,
  interestFilter,
  onInterestFilterChange,
}: {
  status: string;
  prospects: Prospect[];
  isLoading: boolean;
  interestFilter: InterestFilter;
  onInterestFilterChange: (value: InterestFilter) => void;
}) {
  const filteredProspects = filterByInterest(prospects, interestFilter);

  const statusSlug = status.replace(/\s+/g, "-").toLowerCase();

  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          className={`flex flex-col min-w-[260px] max-w-[320px] w-full bg-muted/40 rounded-md transition-colors duration-200 ${
            snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary/30" : ""
          }`}
          data-testid={`column-${statusSlug}`}
        >
          <div className="flex flex-col gap-1.5 px-3 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${columnColors[status] || "bg-gray-400"}`} />
              <h3 className="text-sm font-semibold truncate">{status}</h3>
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center no-default-active-elevate"
                data-testid={`badge-count-${statusSlug}`}
              >
                {filteredProspects.length}
              </Badge>
            </div>
            <Select
              value={interestFilter}
              onValueChange={(val) => onInterestFilterChange(val as InterestFilter)}
            >
              <SelectTrigger
                className="h-7 text-xs w-full"
                data-testid={`filter-interest-${statusSlug}`}
              >
                <SelectValue placeholder="Filter by interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" data-testid={`filter-option-all-${statusSlug}`}>All</SelectItem>
                {INTEREST_LEVELS.map((level) => (
                  <SelectItem
                    key={level}
                    value={level}
                    data-testid={`filter-option-${level.toLowerCase()}-${statusSlug}`}
                  >
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            className="flex-1 overflow-y-auto px-2 py-2"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-28 rounded-md" />
                  <Skeleton className="h-20 rounded-md" />
                </>
              ) : filteredProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center" data-testid={`empty-${statusSlug}`}>
                  <p className="text-xs text-muted-foreground">No prospects</p>
                </div>
              ) : (
                filteredProspects.map((prospect, index) => (
                  <Draggable
                    key={prospect.id}
                    draggableId={String(prospect.id)}
                    index={index}
                  >
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={dragSnapshot.isDragging ? "opacity-90" : ""}
                        data-testid={`draggable-prospect-${prospect.id}`}
                      >
                        <ProspectCard prospect={prospect} isDragging={dragSnapshot.isDragging} />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          </div>
        </div>
      )}
    </Droppable>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interestFilters, setInterestFilters] = useState<Record<string, InterestFilter>>(
    () => Object.fromEntries(STATUSES.map((s) => [s, "All" as InterestFilter]))
  );
  const { toast } = useToast();

  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/prospects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
    },
    onError: () => {
      toast({ title: "Failed to move prospect", variant: "destructive" });
    },
  });

  const groupedByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = (prospects ?? []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, Prospect[]>,
  );

  const totalCount = prospects?.length ?? 0;

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const prospectId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;

    updateStatusMutation.mutate({ id: prospectId, status: newStatus });
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-tight" data-testid="text-app-title">
                  JobTrackr
                </h1>
                <p className="text-xs text-muted-foreground" data-testid="text-prospect-count">
                  {totalCount} prospect{totalCount !== 1 ? "s" : ""} tracked
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-prospect">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Prospect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Prospect</DialogTitle>
                </DialogHeader>
                <AddProspectForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-4 h-full min-w-max">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                prospects={groupedByStatus[status] || []}
                isLoading={isLoading}
                interestFilter={interestFilters[status]}
                onInterestFilterChange={(val) =>
                  setInterestFilters((prev) => ({ ...prev, [status]: val }))
                }
              />
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
