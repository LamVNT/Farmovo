package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.mapper.ZoneMapper;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.ZoneRepository;
import com.farmovo.backend.services.StoreService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;

@ExtendWith(MockitoExtension.class)
class ZoneServiceImplTest {

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private ZoneMapper zoneMapper;

    @Mock
    private StoreService storeService;

    @InjectMocks
    private ZoneServiceImpl zoneService;

    @Test
    void testCreateZoneSuccess() {
        // Given
        ZoneRequestDto request = new ZoneRequestDto("Khu A", "Zone A", 1L);

        Zone zoneToSave = new Zone();
        zoneToSave.setZoneName("Khu A");
        zoneToSave.setZoneDescription("Zone A");

        // Mock Store
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Store 1");

        Zone savedZone = new Zone();
        savedZone.setId(1L);
        savedZone.setZoneName("Khu A");
        savedZone.setZoneDescription("Zone A");
        savedZone.setCreatedAt(LocalDateTime.of(2024, 1, 1, 12, 0));
        savedZone.setStore(store);

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                1L,
                "Khu A",
                "Zone A",
                null,
                LocalDateTime.of(2024, 1, 1, 12, 0),
                null,
                null,
                null,
                1L,
                "Store 1"
        );

        Mockito.when(zoneMapper.toEntity(request)).thenReturn(zoneToSave);
        Mockito.when(storeService.getStoreById(1L)).thenReturn(Optional.of(store));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(savedZone);
        Mockito.when(zoneMapper.toResponseDto(savedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.createZone(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getZoneName()).isEqualTo("Khu A");
        assertThat(result.getZoneDescription()).isEqualTo("Zone A");
        assertThat(result.getCreateAt()).isEqualTo(LocalDateTime.of(2024, 1, 1, 12, 0));

        // Verify interactions
        Mockito.verify(zoneMapper).toEntity(request);
        Mockito.verify(storeService).getStoreById(1L);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(savedZone);
    }

    @Test
    void testUpdateZoneSuccess() {
        // Given
        Long id = 1L;
        ZoneRequestDto request = new ZoneRequestDto("Khu B", "Updated Description", 1L);

        // Mock Store
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Store 1");

        Zone existingZone = new Zone();
        existingZone.setId(id);
        existingZone.setZoneName("Khu A");
        existingZone.setZoneDescription("Old Description");
        existingZone.setStore(store);

        Zone updatedZone = new Zone();
        updatedZone.setId(id);
        updatedZone.setZoneName("Khu B");
        updatedZone.setZoneDescription("Updated Description");
        updatedZone.setUpdatedAt(LocalDateTime.of(2024, 1, 1, 14, 0));
        updatedZone.setStore(store);

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                id,
                "Khu B",
                "Updated Description",
                null,
                null,
                LocalDateTime.of(2024, 1, 1, 14, 0),
                null,
                null,
                1L,
                "Store 1"
        );

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));
        Mockito.when(storeService.getStoreById(1L)).thenReturn(Optional.of(store));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(updatedZone);
        Mockito.when(zoneMapper.toResponseDto(updatedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.updateZone(id, request);

        // Then
        assertThat(result.getZoneName()).isEqualTo("Khu B");
        assertThat(result.getZoneDescription()).isEqualTo("Updated Description");

        Mockito.verify(zoneRepository).findById(id);
        Mockito.verify(storeService).getStoreById(1L);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(updatedZone);
    }


    @Test
    void testUpdateZoneWithEmptyZoneName() { // zonename rỗng
        Long id = 1L;
        ZoneRequestDto request = new ZoneRequestDto("", "Desc", 1L);

        // Mock Store
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Store 1");

        Zone existingZone = new Zone();
        existingZone.setId(id);
        existingZone.setStore(store);

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));
        Mockito.when(storeService.getStoreById(1L)).thenReturn(Optional.of(store));

        assertThatThrownBy(() -> zoneService.updateZone(id, request))
                .isInstanceOf(com.farmovo.backend.exceptions.ValidationException.class)
                .hasMessageContaining("ZoneName cannot be empty");

        Mockito.verify(zoneRepository).findById(id);
        Mockito.verify(storeService).getStoreById(1L);
    }

    @Test
    void testDeleteZoneSuccess() {
        Long id = 1L;
        Zone existingZone = new Zone();
        existingZone.setId(id);

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));

        zoneService.deleteZone(id);

        Mockito.verify(zoneRepository).delete(existingZone);
    }

    @Test
    void testGetAllZones() {
        Zone zone1 = new Zone();
        zone1.setZoneName("Khu A");
        Zone zone2 = new Zone();
        zone2.setZoneName("Khu B");
        List<Zone> zones = List.of(zone1, zone2);

        ZoneResponseDto dto1 = new ZoneResponseDto(1L, "Khu A", null, null, null, null, null, null, 1L, "Store 1");
        ZoneResponseDto dto2 = new ZoneResponseDto(2L, "Khu B", null, null, null, null, null, null, 1L, "Store 1");
        List<ZoneResponseDto> expected = List.of(dto1, dto2);

        Mockito.when(zoneRepository.findAll()).thenReturn(zones);
        Mockito.when(zoneMapper.toResponseDto(zone1)).thenReturn(dto1);
        Mockito.when(zoneMapper.toResponseDto(zone2)).thenReturn(dto2);

        List<ZoneResponseDto> result = zoneService.getAllZones();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getZoneName()).isEqualTo("Khu A");
    }

    @Test
    void testGetAllZonesWithStoreName() {
        // Given
        Zone zone1 = new Zone();
        zone1.setZoneName("Khu A");
        zone1.setZoneDescription("Zone A");
        
        Zone zone2 = new Zone();
        zone2.setZoneName("Khu B");
        zone2.setZoneDescription("Zone B");
        
        List<Zone> zones = List.of(zone1, zone2);

        ZoneResponseDto dto1 = new ZoneResponseDto(1L, "Khu A", "Zone A", null, null, null, null, null, 1L, "Store 1");
        ZoneResponseDto dto2 = new ZoneResponseDto(2L, "Khu B", "Zone B", null, null, null, null, null, 2L, "Store 2");
        List<ZoneResponseDto> expected = List.of(dto1, dto2);

        Mockito.when(zoneRepository.findAll()).thenReturn(zones);
        Mockito.when(zoneMapper.toResponseDto(zone1)).thenReturn(dto1);
        Mockito.when(zoneMapper.toResponseDto(zone2)).thenReturn(dto2);

        // When
        List<ZoneResponseDto> result = zoneService.getAllZones();

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getZoneName()).isEqualTo("Khu A");
        assertThat(result.get(0).getStoreName()).isEqualTo("Store 1");
        assertThat(result.get(1).getZoneName()).isEqualTo("Khu B");
        assertThat(result.get(1).getStoreName()).isEqualTo("Store 2");
    }

    @Test
    void testCreateZoneWithStoreName() {
        // Given
        ZoneRequestDto request = new ZoneRequestDto("Khu C", "Zone C", 2L);

        Zone zoneToSave = new Zone();
        zoneToSave.setZoneName("Khu C");
        zoneToSave.setZoneDescription("Zone C");

        // Mock Store
        Store store = new Store();
        store.setId(2L);
        store.setStoreName("Store 2");

        Zone savedZone = new Zone();
        savedZone.setId(3L);
        savedZone.setZoneName("Khu C");
        savedZone.setZoneDescription("Zone C");
        savedZone.setCreatedAt(LocalDateTime.of(2024, 1, 1, 15, 0));
        savedZone.setStore(store);

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                3L,
                "Khu C",
                "Zone C",
                null,
                LocalDateTime.of(2024, 1, 1, 15, 0),
                null,
                null,
                null,
                2L,
                "Store 2"
        );

        Mockito.when(zoneMapper.toEntity(request)).thenReturn(zoneToSave);
        Mockito.when(storeService.getStoreById(2L)).thenReturn(Optional.of(store));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(savedZone);
        Mockito.when(zoneMapper.toResponseDto(savedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.createZone(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(3L);
        assertThat(result.getZoneName()).isEqualTo("Khu C");
        assertThat(result.getZoneDescription()).isEqualTo("Zone C");
        assertThat(result.getStoreId()).isEqualTo(2L);
        assertThat(result.getStoreName()).isEqualTo("Store 2");
        assertThat(result.getCreateAt()).isEqualTo(LocalDateTime.of(2024, 1, 1, 15, 0));

        // Verify interactions
        Mockito.verify(zoneMapper).toEntity(request);
        Mockito.verify(storeService).getStoreById(2L);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(savedZone);
    }

    @Test
    void testUpdateZoneWithStoreName() {
        // Given
        Long id = 1L;
        ZoneRequestDto request = new ZoneRequestDto("Khu D", "Updated Zone D", 3L);

        // Mock Store
        Store store = new Store();
        store.setId(3L);
        store.setStoreName("Store 3");

        Zone existingZone = new Zone();
        existingZone.setId(id);
        existingZone.setZoneName("Khu A");
        existingZone.setZoneDescription("Old Description");
        existingZone.setStore(store);

        Zone updatedZone = new Zone();
        updatedZone.setId(id);
        updatedZone.setZoneName("Khu D");
        updatedZone.setZoneDescription("Updated Zone D");
        updatedZone.setUpdatedAt(LocalDateTime.of(2024, 1, 1, 16, 0));
        updatedZone.setStore(store);

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                id,
                "Khu D",
                "Updated Zone D",
                null,
                null,
                LocalDateTime.of(2024, 1, 1, 16, 0),
                null,
                null,
                3L,
                "Store 3"
        );

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));
        Mockito.when(storeService.getStoreById(3L)).thenReturn(Optional.of(store));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(updatedZone);
        Mockito.when(zoneMapper.toResponseDto(updatedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.updateZone(id, request);

        // Then
        assertThat(result.getZoneName()).isEqualTo("Khu D");
        assertThat(result.getZoneDescription()).isEqualTo("Updated Zone D");
        assertThat(result.getStoreId()).isEqualTo(3L);
        assertThat(result.getStoreName()).isEqualTo("Store 3");

        Mockito.verify(zoneRepository).findById(id);
        Mockito.verify(storeService).getStoreById(3L);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(updatedZone);
    }

    @Test
    void testGetAllZonesWithNullStoreName() {
        // Given
        Zone zone1 = new Zone();
        zone1.setZoneName("Khu A");
        zone1.setZoneDescription("Zone A");
        
        List<Zone> zones = List.of(zone1);

        ZoneResponseDto dto1 = new ZoneResponseDto(1L, "Khu A", "Zone A", null, null, null, null, null, 1L, null);
        List<ZoneResponseDto> expected = List.of(dto1);

        Mockito.when(zoneRepository.findAll()).thenReturn(zones);
        Mockito.when(zoneMapper.toResponseDto(zone1)).thenReturn(dto1);

        // When
        List<ZoneResponseDto> result = zoneService.getAllZones();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getZoneName()).isEqualTo("Khu A");
        assertThat(result.get(0).getStoreName()).isNull();
    }

    @Test
    void testCreateZoneWithNullStoreName() {
        // Given
        ZoneRequestDto request = new ZoneRequestDto("Khu E", "Zone E", null);

        Zone zoneToSave = new Zone();
        zoneToSave.setZoneName("Khu E");
        zoneToSave.setZoneDescription("Zone E");

        Zone savedZone = new Zone();
        savedZone.setId(5L);
        savedZone.setZoneName("Khu E");
        savedZone.setZoneDescription("Zone E");
        savedZone.setCreatedAt(LocalDateTime.of(2024, 1, 1, 17, 0));

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                5L,
                "Khu E",
                "Zone E",
                null,
                LocalDateTime.of(2024, 1, 1, 17, 0),
                null,
                null,
                null,
                null,
                null
        );

        Mockito.when(zoneMapper.toEntity(request)).thenReturn(zoneToSave);
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(savedZone);
        Mockito.when(zoneMapper.toResponseDto(savedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.createZone(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(5L);
        assertThat(result.getZoneName()).isEqualTo("Khu E");
        assertThat(result.getZoneDescription()).isEqualTo("Zone E");
        assertThat(result.getStoreId()).isNull();
        assertThat(result.getStoreName()).isNull();
        assertThat(result.getCreateAt()).isEqualTo(LocalDateTime.of(2024, 1, 1, 17, 0));

        // Verify interactions
        Mockito.verify(zoneMapper).toEntity(request);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(savedZone);
    }

    @Test
    void testZoneMappingWithStore() {
        // Given
        Zone zone = new Zone();
        zone.setId(1L);
        zone.setZoneName("Khu A");
        zone.setZoneDescription("Test Zone");
        
        // Mock Store object
        com.farmovo.backend.models.Store store = new com.farmovo.backend.models.Store();
        store.setId(1L);
        store.setStoreName("Test Store");
        zone.setStore(store);

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                1L,
                "Khu A",
                "Test Zone",
                null,
                null,
                null,
                null,
                null,
                1L,
                "Test Store"
        );

        Mockito.when(zoneMapper.toResponseDto(zone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneMapper.toResponseDto(zone);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getZoneName()).isEqualTo("Khu A");
        assertThat(result.getZoneDescription()).isEqualTo("Test Zone");
        assertThat(result.getStoreId()).isEqualTo(1L);
        assertThat(result.getStoreName()).isEqualTo("Test Store");

        // Verify that mapper was called
        Mockito.verify(zoneMapper).toResponseDto(zone);
    }

    @Test
    void testCreateZoneWithDuplicateName() {
        // Given - Tạo 2 zone với cùng tên (bây giờ được phép)
        ZoneRequestDto request1 = new ZoneRequestDto("Khu A", "Zone A", 1L);
        ZoneRequestDto request2 = new ZoneRequestDto("Khu A", "Zone A Duplicate", 1L);

        // Mock Store
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Store 1");

        Zone zone1 = new Zone();
        zone1.setId(1L);
        zone1.setZoneName("Khu A");
        zone1.setZoneDescription("Zone A");
        zone1.setStore(store);

        Zone zone2 = new Zone();
        zone2.setId(2L);
        zone2.setZoneName("Khu A");
        zone2.setZoneDescription("Zone A Duplicate");
        zone2.setStore(store);

        ZoneResponseDto dto1 = new ZoneResponseDto(1L, "Khu A", "Zone A", null, null, null, null, null, 1L, "Store 1");
        ZoneResponseDto dto2 = new ZoneResponseDto(2L, "Khu A", "Zone A Duplicate", null, null, null, null, null, 1L, "Store 1");

        Mockito.when(zoneMapper.toEntity(request1)).thenReturn(zone1);
        Mockito.when(zoneMapper.toEntity(request2)).thenReturn(zone2);
        Mockito.when(storeService.getStoreById(1L)).thenReturn(Optional.of(store));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(zone1).thenReturn(zone2);
        Mockito.when(zoneMapper.toResponseDto(zone1)).thenReturn(dto1);
        Mockito.when(zoneMapper.toResponseDto(zone2)).thenReturn(dto2);

        // When - Tạo 2 zone với cùng tên
        ZoneResponseDto result1 = zoneService.createZone(request1);
        ZoneResponseDto result2 = zoneService.createZone(request2);

        // Then - Cả 2 đều thành công
        assertThat(result1).isNotNull();
        assertThat(result1.getZoneName()).isEqualTo("Khu A");
        assertThat(result1.getZoneDescription()).isEqualTo("Zone A");

        assertThat(result2).isNotNull();
        assertThat(result2.getZoneName()).isEqualTo("Khu A");
        assertThat(result2.getZoneDescription()).isEqualTo("Zone A Duplicate");

        // Verify interactions
        Mockito.verify(zoneMapper, Mockito.times(2)).toEntity(Mockito.any(ZoneRequestDto.class));
        Mockito.verify(storeService, Mockito.times(2)).getStoreById(1L);
        Mockito.verify(zoneRepository, Mockito.times(2)).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper, Mockito.times(2)).toResponseDto(Mockito.any(Zone.class));
    }

}





