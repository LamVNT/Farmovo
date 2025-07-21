package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.mapper.ZoneMapper;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.repositories.ZoneRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;

@ExtendWith(MockitoExtension.class)
class ZoneServiceImplTest {

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private ZoneMapper zoneMapper;

    @InjectMocks
    private ZoneServiceImpl zoneService;

    @Test
    void testCreateZoneSuccess() {
        // Given
        ZoneRequestDto request = new ZoneRequestDto("Z_[1;1]", "Zone A");

        Zone zoneToSave = new Zone();
        zoneToSave.setZoneName("Z_[1;1]");
        zoneToSave.setZoneDescription("Zone A");

        Zone savedZone = new Zone();
        savedZone.setId(1L);
        savedZone.setZoneName("Z_[1;1]");
        savedZone.setZoneDescription("Zone A");
        savedZone.setCreatedAt(LocalDateTime.of(2024, 1, 1, 12, 0)); // ví dụ cứng để dễ so sánh

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                1L,
                "Z_[1;1]",
                "Zone A",
                null,
                LocalDateTime.of(2024, 1, 1, 12, 0),
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
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getZoneName()).isEqualTo("Z_[1;1]");
        assertThat(result.getZoneDescription()).isEqualTo("Zone A");
        assertThat(result.getCreateAt()).isEqualTo(LocalDateTime.of(2024, 1, 1, 12, 0));

        // Verify interactions
        Mockito.verify(zoneMapper).toEntity(request);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(savedZone);
    }

    @Test
    void testUpdateZoneSuccess() {
        // Given
        Long id = 1L;
        ZoneRequestDto request = new ZoneRequestDto("Z_[2;3]", "Updated Description");

        Zone existingZone = new Zone();
        existingZone.setId(id);
        existingZone.setZoneName("Z_[1;1]");
        existingZone.setZoneDescription("Old Description");

        Zone updatedZone = new Zone();
        updatedZone.setId(id);
        updatedZone.setZoneName("Z_[2;3]");
        updatedZone.setZoneDescription("Updated Description");
        updatedZone.setUpdatedAt(LocalDateTime.of(2024, 1, 1, 14, 0));

        ZoneResponseDto expectedDto = new ZoneResponseDto(
                id,
                "Z_[2;3]",
                "Updated Description",
                null,
                null,
                LocalDateTime.of(2024, 1, 1, 14, 0),
                null,
                null
        );

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));
        Mockito.when(zoneRepository.save(Mockito.any(Zone.class))).thenReturn(updatedZone);
        Mockito.when(zoneMapper.toResponseDto(updatedZone)).thenReturn(expectedDto);

        // When
        ZoneResponseDto result = zoneService.updateZone(id, request);

        // Then
        assertThat(result.getZoneName()).isEqualTo("Z_[2;3]");
        assertThat(result.getZoneDescription()).isEqualTo("Updated Description");

        Mockito.verify(zoneRepository).findById(id);
        Mockito.verify(zoneRepository).save(Mockito.any(Zone.class));
        Mockito.verify(zoneMapper).toResponseDto(updatedZone);
    }


    @Test
    void testUpdateZoneWithInvalidZoneName() { // zonename sai format
        Long id = 1L;
        ZoneRequestDto request = new ZoneRequestDto("INVALID", "Desc");

        Zone existingZone = new Zone();
        existingZone.setId(id);

        Mockito.when(zoneRepository.findById(id)).thenReturn(java.util.Optional.of(existingZone));

        assertThatThrownBy(() -> zoneService.updateZone(id, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Zone name must follow pattern Z_[row;column], eg Z_[1;3]");

        Mockito.verify(zoneRepository).findById(id);
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
        zone1.setZoneName("Z_[1;1]");
        Zone zone2 = new Zone();
        zone2.setZoneName("Z_[2;2]");
        List<Zone> zones = List.of(zone1, zone2);

        ZoneResponseDto dto1 = new ZoneResponseDto();
        dto1.setZoneName("Z_[1;1]");
        ZoneResponseDto dto2 = new ZoneResponseDto();
        dto2.setZoneName("Z_[2;2]");
        List<ZoneResponseDto> expected = List.of(dto1, dto2);

        Mockito.when(zoneRepository.findAll()).thenReturn(zones);
        Mockito.when(zoneMapper.toResponseDto(zone1)).thenReturn(dto1);
        Mockito.when(zoneMapper.toResponseDto(zone2)).thenReturn(dto2);

        List<ZoneResponseDto> result = zoneService.getAllZones();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getZoneName()).isEqualTo("Z_[1;1]");
    }

}





