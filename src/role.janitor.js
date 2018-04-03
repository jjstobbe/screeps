var helpers = require('helpers');
var rank = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_WALL];

var roleJanitor = {
    run: function(creep) {
	    if(creep.memory.repairing && creep.carry.energy == 0) {
            creep.memory.repairing = false;
            creep.memory.repairTargetId = null;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.repairing = true;
	        creep.memory.sourceTargetId = null;
	        creep.say('🚧 repairing');
	    }
        
        if(creep.memory.repairing) {
            var structs = creep.room.find(FIND_STRUCTURES);
            if(!creep.memory.repairTargetId) {
                creep.memory.repairTargetId = this.findrepairTargetId(creep, structs);
            }
            
            if(creep.memory.repairTargetId) {
                var repairTarget = Game.getObjectById(creep.memory.repairTargetId);
                
                if (!repairTarget) {
                    creep.memory.repairTargetId = null;
                } else {
                    if(creep.memory.typeOfRepair == 'transfer') {
                        if(creep.transfer(repairTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(repairTarget, {visualizePathStyle: {stroke: '#ffffff'}});
                        } else if(repairTarget.hits == repairTarget.hitsMax) {
                            creep.memory.repairTargetId = null;
                        }
                    } else {
                        if(creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(repairTarget, { ignoreDestructibleStructures: true, visualizePathStyle: {stroke: '#ffffff'}});
                        } else if(repairTarget.hits == repairTarget.hitsMax || repairTarget.hits > Memory.rooms[creep.memory.baseRoom].maxWallHits) {
                            creep.memory.repairTargetId = null;
                        }
                    }
                }
            }
        } else {
            if (!creep.memory.sourceTargetId) {
                creep.memory.sourceTargetId = this.findSourceTargetId(creep);
            }
            
            if (creep.memory.sourceTargetId) {
                var sourceTarget = Game.getObjectById(creep.memory.sourceTargetId);
                
                // sourceTarget becomes null if the tombstone expires or
                if (!sourceTarget) {
                    creep.memory.sourceTargetId = null;
                } else {
                    if (sourceTarget.deathTime || sourceTarget.structureType) { // Tombstone or container
                        var response = creep.withdraw(sourceTarget, RESOURCE_ENERGY);
                        if (response == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sourceTarget.pos);
                        } else if (sourceTarget.energy ) {
                            creep.memory.sourceTargetId = null;
                        }
                    } else if (sourceTarget.resourceType) { // dropped energy
                        var response = creep.pickup(sourceTarget);
                        if (response == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sourceTarget.pos);
                        }  else if(response == ERR_NOT_ENOUGH_RESOURCES || sourceTarget.energy <= 10) {
                            if(creep.room.storage.store.energy > Memory.rooms[creep.room.name].storageMax) {
                                creep.memory.sourceTargetId = creep.room.storage.id;
                            } else {
                                creep.memory.sourceTargetId = null;
                            }
                        }
                    } else if (!sourceTarget.hits) {
                        var response = creep.harvest(sourceTarget);
                        if (response == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sourceTarget);
                        } else if (response != OK) {
                            creep.memory.sourceTargetId = null;
                        }
                    }
                }
            }
        }
	},
	findrepairTargetId: function(creep, structs) {
        var tower = Game.getObjectById('5ab9f31a08c31d243aa6d46c');
        var tower2 = Game.getObjectById('5abd83ba0ba59647cbeef2bb');
        if(tower.energy < tower.energyCapacity) {
            creep.memory.typeOfRepair = 'transfer';
            return tower.id;
        } else if(tower2.energy < tower2.energyCapacity) {
            creep.memory.typeOfRepair = 'transfer';
            return tower2.id;
        }
        
        creep.memory.typeOfRepair = 'repair';
        
        var target;
        var i = 0;
        for (i = 0;i<rank.length;i++) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (t) => {
                    if (Game.spawns['Spawn1'].pos.getRangeTo(t) <= 30 && rank[i] == t.structureType) {
                        if (rank[i] == STRUCTURE_ROAD) {
                            if (t.hits < 3000) return true;
                            return false;
                        } else if (rank[i] == STRUCTURE_RAMPART || rank[i] == STRUCTURE_WALL) {
                            if (t.hits < creep.room.memory.maxWallHits) return true;
                            return false;
                        } else if (t.structureType == rank[i] && t.hits < t.hitsMax && Game.spawns['Spawn1'].pos.getRangeTo(t) <= 30) {
                            return true;
                        }
                    }
                    return false;
                }
            });
            
            if (target) {
                return target.id;
            }
        }
        
        return null;
	},
	findSourceTargetId: function(creep) {
	    var tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
            filter: (t) => t.store.energy > 50
        });
        if (tombstone) {
            return tombstone.id;
        }
        
        var droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.energy > 0
        });
        if(droppedEnergy) {
            return droppedEnergy.id;
        }
        
        var container = helpers.getClosestContainer(creep);
        if(container) {
            return container.id;
        }
        
        var source = helpers.getSourceForCreep(creep);
        if(source) {
            return source.id;
        }
        
        return null;
	},
	spawn: function(spawnName, energyAmount) {
	    body = helpers.generateBody(energyAmount, [WORK, CARRY, MOVE]);
	    
	    var memoryContents = { role: 'janitor', repairing: false, sourceTargetId: null, typeOfRepair: null, repairTargetId: null };
	    
	    helpers.spawn(spawnName, energyAmount, body, memoryContents);
	},
};

module.exports = roleJanitor;