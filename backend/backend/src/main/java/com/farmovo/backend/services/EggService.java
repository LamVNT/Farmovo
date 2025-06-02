package com.farmovo.backend.services;

import com.farmovo.backend.models.Egg;
import java.util.List;

public interface EggService {
    List<Egg> getAllEggs();
    Egg saveEgg(Egg egg);


}
