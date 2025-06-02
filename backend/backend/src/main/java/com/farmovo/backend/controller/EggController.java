package com.farmovo.backend.controller;

import com.farmovo.backend.models.Egg;
import com.farmovo.backend.services.EggService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eggs")
@CrossOrigin(origins = "http://localhost:3000")
public class EggController {
    private final EggService eggService;

    public EggController(EggService eggService) {
        this.eggService = eggService;
    }

    @GetMapping
    public List<Egg> getEggs() {
        return eggService.getAllEggs();
    }


    @PostMapping
    public Egg createEgg(@RequestBody Egg egg) {
        return eggService.saveEgg(egg);
    }
}
