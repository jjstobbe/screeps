var helpers = require('helpers');
var longTerm = require('longTermFunctions');
var roleBuilder = require('role.builder');
var roleDistanceHarvester = require('role.distanceHarvester');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleJanitor = require('role.janitor');
var roleMiner = require('role.miner');

module.exports.loop = function () {
    var mainSpawn = Game.spawns['Spawn1'];
    var roomMemory = Memory.rooms[mainSpawn.room.name];
    
    if(mainSpawn.hits < mainSpawn.hitsMax) {
        mainSpawn.room.controller.activateSafeMode();
    }
    
    for(var name in Memory.creeps) {
        var deletedCreep = Memory.creeps[name];
        if(!Game.creeps[name]) {
            // Check if miner dies, then we have to set the flag in memory
            if(deletedCreep.role == 'miner') {
                Memory.sources[deletedCreep.targetSourceId].hasMiner = false;
                
                roleHarvester.removeSourceIdIfMinerDied(deletedCreep);
            }
            
            var deletedCreepRoom = Game.rooms[deletedCreep.roomName ? deletedCreep.roomName : mainSpawn.room.name];
            deletedCreepRoom.memory[deletedCreep.role+'Count'] --;
            
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    var tower = Game.getObjectById('5ab9f31a08c31d243aa6d46c');
    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile && closestHostile.owner && closestHostile.owner.username != 'Baldinater' && closestHostile.owner.username != 'luketheduke') {
        tower.attack(closestHostile);
    }
    
    var tower2 = Game.getObjectById('5abd83ba0ba59647cbeef2bb');
    var closestHostile = tower2.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile && closestHostile.owner && closestHostile.owner.username != 'Baldinater' && closestHostile.owner.username != 'luketheduke') {
        tower2.attack(closestHostile);
    }
    
    var energyUsed = mainSpawn.room.energyCapacityAvailable - 300;
    
    if(roomMemory.harvesterCount + roomMemory.minerCount + roomMemory.janitorCount + roomMemory.upgraderCount + roomMemory.builderCount  < 4) {
        energyUsed = 550;
    }
    
    if (roomMemory.harvesterCount == 0) {
        roleHarvester.spawn(mainSpawn.name, mainSpawn.room.energyAvailable);
    }
    
    if (roomMemory.minerCount < Object.keys(Memory.sources).length) {
        if(mainSpawn.room.energyAvailable >= 550) {
            roleMiner.spawn(mainSpawn.name, energyUsed);
        }
    } else if(mainSpawn.room.energyAvailable >= energyUsed) {
        if(roomMemory.harvesterCount == 0) {
            roleHarvester.spawn(mainSpawn.name, energyUsed);
        } else if(roomMemory.janitorCount == 0) {
            roleJanitor.spawn(mainSpawn.name, energyUsed);
        } else if(roomMemory.upgraderCount == 0) {
            roleBuilder.spawn(mainSpawn.name, energyUsed);
        } else if(!roomMemory.distanceHarvesterCount || roomMemory.distanceHarvesterCount == 0) {
            roleDistanceHarvester.spawn(mainSpawn.name, energyUsed, 'Flag1');
        }
        
        else if(roomMemory.harvesterCount < 2) {
            roleHarvester.spawn(mainSpawn.name, energyUsed);
        } else if(roomMemory.upgraderCount < 4) {
            roleBuilder.spawn(mainSpawn.name, energyUsed);
        } else {
            var sites = mainSpawn.room.find(FIND_CONSTRUCTION_SITES);
            if(roomMemory.builderCount == 0 && sites.length > 0) {
                roleBuilder.spawn(mainSpawn.name, energyUsed);
            } else if(mainSpawn.room.energyAvailable == mainSpawn.room.energyCapacityAvailable){
                for(var name in Game.creeps) {
                    var creep = Game.creeps[name];
                    if(creep.memory.role == 'harvester') {
                        roleHarvester.setToStorage(creep);
                    }
                }
            }
        }
    }
    
    if(mainSpawn.spawning) {
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if(creep.memory.role == 'harvester') {
                roleHarvester.setToNormal(creep);
            }
        }
        
        var spawningCreep = Game.creeps[mainSpawn.spawning.name];
        mainSpawn.room.visual.text(
            '???' + spawningCreep.memory.role,
            mainSpawn.pos.x + 1, 
            mainSpawn.pos.y, 
            {align: 'left', opacity: 0.8});
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        } else if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        } else if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        } else if(creep.memory.role == 'janitor') {
            roleJanitor.run(creep);
        } else if(creep.memory.role == 'miner') {
            roleMiner.run(creep, 'Spawn1');
        } else if(creep.memory.role == 'distanceHarvester') {
            roleDistanceHarvester.run(creep);
        }
    }
    
    if(Game.time % 1500 == 0) {
        if(!roomMemory.maxWallHits) {
            roomMemory.maxWallHits = 30000;
        } else {
            roomMemory.maxWallHits += 250;
        }
        
        if(!roomMemory.storageMax) {
            roomMemory.storageMax = 20000;
        } else {
            roomMemory.storageMax += 400;
        }
    }
}