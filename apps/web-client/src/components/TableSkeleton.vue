<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead v-for="c in columns" :key="c">
          <Skeleton class="h-4 w-20" />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="r in rows" :key="r">
        <TableCell v-for="c in columns" :key="c">
          <Skeleton class="h-4 w-full" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

withDefaults(
  defineProps<{
    columns: number;
    rows?: number;
  }>(),
  { rows: 5 },
);
</script>
