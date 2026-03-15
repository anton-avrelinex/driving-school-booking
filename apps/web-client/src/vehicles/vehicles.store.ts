import { ref } from "vue";
import { defineStore } from "pinia";
import {
  type VehicleDto,
  type CreateVehicleDto,
  type UpdateVehicleDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useVehicleStore = defineStore("vehicles", () => {
  const vehicles = ref<VehicleDto[]>([]);

  async function fetchVehicles() {
    const { data } = await api.get<VehicleDto[]>("/vehicles");
    vehicles.value = data;
  }

  async function createVehicle(payload: CreateVehicleDto) {
    const { data } = await api.post<VehicleDto>("/vehicles", payload);
    await fetchVehicles();
    return data;
  }

  async function updateVehicle(id: string, payload: UpdateVehicleDto) {
    const { data } = await api.patch<VehicleDto>(`/vehicles/${id}`, payload);
    await fetchVehicles();
    return data;
  }

  async function deleteVehicle(id: string) {
    await api.delete(`/vehicles/${id}`);
    await fetchVehicles();
  }

  return {
    vehicles,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
});
