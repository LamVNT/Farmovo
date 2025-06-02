package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.Egg;
import com.farmovo.backend.repositories.EggRepository;
import com.farmovo.backend.services.EggService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EggServiceImpl implements EggService {
    private final EggRepository eggRepository;

    public EggServiceImpl(EggRepository eggRepository) {
        this.eggRepository = eggRepository;
    }

    @Override
    public List<Egg> getAllEggs() {
        return eggRepository.findAll();
    }

    @Override
    public Egg saveEgg(Egg egg) {
        return eggRepository.save(egg);
    }


}
