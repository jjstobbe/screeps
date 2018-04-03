var helpers = require('helpers');

var roleHarvester = {
    run: function(creep) {
    	if(creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.harvesting = false;
            creep.memory.destTargetId = null;
	        creep.say('?? depositing');
	    }
	    if(!creep.memory.harvesting && creep.carry.energy == 0) {
            creep.memory.harvesting = true;
            creep.memory.sourceTargetId = null;
            creep.say('?? harvesting');
	    } 
        
	    if(creep.memory.harvesting && creep.carry.energy < creep.carryCapacity) {
            // generate sourceTarget - miner removes this if it dies
	        if (!creep.memory.sourceTargetId) { 
	            var harvesterSource = helpers.getSourceForCreep(creep);
	            var minerCount = Memory.rooms[creep.memory.baseRoom].minerCount;
	            
	            // Move away if miner is on the way
	            if (Memory.sources[harvesterSource.id].hasMiner) {
	                creep.memory.sourceTargetId = helpers.getContainerIdForSource(harvesterSource);
	            } else if (!Memory.sources[harvesterSource.id].hasMiner && minerCount == 2) {
	                creep.moveTo(37,32);
	            } else if (!Memory.sources[harvesterSource.id].hasMiner && (minerCount == 0 || minerCount == 1)) {
	                // if no miner, then go to storage or harvest yourself
	                if(creep.room.storage.store.energy > 10000) {
	                    creep.memory.sourceTargetId = creep.room.storage.id;
	                } else {
	                    creep.memory.sourceTargetId = harvesterSource.id;
	                }
	            }
	        }
	        
	        // Harvest / withdraw from the sourceTarget 
	        if (creep.memory.sourceTargetId) {
	            var sourceTarget = Game.getObjectById(creep.memory.sourceTargetId);
	            
	            if(sourceTarget.hits != null) {
	                var response = creep.withdraw(sourceTarget, RESOURCE_ENERGY);
	            } else {
	                var response = creep.harvest(sourceTarget);
	            }
	            
	            if (response == ERR_NOT_IN_RANGE || response == ERR_NOT_ENOUGH_RESOURCES) {
	                creep.moveTo(sourceTarget);
	            }
	        }
        } else {
            if(!creep.memory.destTargetId) {
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.energy < structure.energyCapacity && 
                                (structure.structureType == STRUCTURE_TOWER ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_EXTENSION);
                    }
                });
                
                if(target) {
    	            creep.memory.destTargetId = target.id;
                }
            }
            
            if(creep.memory.destTargetId) {
                var target = Game.getObjectById(creep.memory.destTargetId);
                
                var response = creep.transfer(target, RESOURCE_ENERGY);
                
                if(response == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                } else if(response == ERR_FULL) {
                    creep.memory.destTargetId = null;
                }
            }
        }
	},
	setToStorage: function(creep) {
	    creep.memory.toStorage = true;
	    
        var storageTarget = creep.room.storage;
        
        if(storageTarget) {
            creep.memory.destTargetId = storageTarget.id;
        }
	},
	setToNormal: function(creep) {
	    creep.memory.toStorage = false;
	},
	isMinerHarvest: function() {
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if(creep.memory.role == 'miner') {
                var minerSource = creep.room.find(FIND_SOURCES, {
                    filter: s => s.id == creep.memory.targetSourceId && roomMemory.sources[s.id].creepType == 'harvest'
                });
                
                if(minerSource.length > 0) {
                    return true;
                }
            }
        }
        
        return false;
	},
	spawn: function(spawnName, energyUsed) {
	    var roomMemory = Memory.rooms[Game.spawns[spawnName].room.name];
	    
	    if (energyUsed > 550) {
	        energyUsed = 550;
	    }
	    
	    if (roomMemory.minerCount == 0) {
            body = helpers.generateBody(energyUsed, [WORK,CARRY,MOVE]);
        } else if (roomMemory.minerCount == 1) {
            if (this.isMinerHarvest()) {
                body = helpers.generateBody(energyUsed, [CARRY,MOVE]);
            } else {
                body = helpers.generateBody(energyUsed, [WORK,CARRY,MOVE]);
            }
	    } else if (roomMemory.minerCount == 2) {
	        body = helpers.generateBody(energyUsed, [CARRY,MOVE]);
	    }
	    
	    var memoryObject = { role: 'harvester', harvesting: false, toStorage: false, destTargetId: null, sourceTargetId: null }; // then have the helper append baseRoom and role
	    
	    helpers.spawn(spawnName, energyUsed, body, memoryObject);
	},
	removeSourceIdIfMinerDied: function(deadMiner) {
	    // Reset harvesters targetsource so that it either harvests from the source or moves out of the way - when the miner dies
        var containerId = Memory.sources[deadMiner.targetSourceId].containerId;
        
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'harvester' && creep.memory.baseRoom == deadMiner.baseRoom && creep.memory.sourceTargetId == containerId) {
                creep.memory.sourceTargetId = null;
            }
        }
	},
};

module.exports = roleHarvester;