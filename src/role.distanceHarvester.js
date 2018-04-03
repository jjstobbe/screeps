var helpers = require('helpers');

var roleDistanceHarvester = {
    run: function(creep) {
    	if(creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.harvesting = false;
	        creep.say('Dropping off');
	    }
	    if(!creep.memory.harvesting && creep.carry.energy == 0) {
            creep.memory.harvesting = true;
            creep.memory.destTargetId = null;
            creep.say('harvesting');
	    }

	    if(creep.memory.harvesting && creep.carry.energy < creep.carryCapacity) {
            // find a flag if the harvester doesn't spawn with one (this should never happen)
	        if (!creep.memory.flagName) {
	            for(var flagName in Game.flags) {
	                if (!Game.flags[flagName].memory.harvesterCount) {
	                    Game.flags[flagName].memory.harvesterCount = 0;
	                }

	                if (Game.flags[flagName].memory.harvesterCount < 2) {
	                    Game.flags[flagName].memory.harvesterCount ++;
	                    creep.memory.flagName = flagName;
	                    break;
	                }
	            }
	        }

	        // Go to distance source to harvest / should probably store the path 
	        if (creep.memory.flagName) {
	            var flag = Game.flags[creep.memory.flagName];
	            // If the creep isn't in the right room
	            if (creep.pos.roomName != flag.pos.roomName) {
	                if (creep.memory.pathToSource) {
	                    creep.moveByPath(creep.memory.pathToSource);
	                } else {
	                    creep.moveTo(flag, { reusePath: 20, visualizePathStyle: {stroke: '#ffffff'}});
	                }
	            } else {
	                // If creep is in the room and looking for source
    	            if (!creep.memory.sourceTargetId) {
    	                var flagPos = JSON.stringify(flag.pos);
    	                var sources = creep.room.find(FIND_SOURCES, {
    	                    filter: s => JSON.stringify(s.pos) == flagPos
    	                });
    	                
    	                if (sources.length > 0) {
    	                    creep.memory.sourceTargetId = sources[0].id;
    	                }
    	            }

    	            if (creep.memory.sourceTargetId) {
        	            var source = Game.getObjectById(creep.memory.sourceTargetId);
        	            
        	            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        	                // try to use moveByPath, doesn't seem to work in other rooms for some reason..
    	                    creep.moveTo(source, { reusePath: 10 });
        	            }
    	            }
	            }
	        }
        } else {
            if (!creep.memory.destTargetId) {
                var target;
                if (creep.memory.doesMaintain) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: t => t.structureType == STRUCTURE_ROAD && t.hits < 3000 && Game.spawns[creep.memory.baseSpawn].pos.getRangeTo(t) > 30
                    });
                    
                    if (!target) {
                        target = Game.rooms[creep.memory.baseRoom].storage;
                    }
                } else {
                    target = Game.rooms[creep.memory.baseRoom].storage;
                }
                
                if (target) {
    	            creep.memory.destTargetId = target.id;
                }   
            }
            
            if (creep.memory.destTargetId) {
                var target = Game.getObjectById(creep.memory.destTargetId);
                
                if (target.structureType == STRUCTURE_ROAD) {
                    if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { ignoreDestructibleStructures: true, visualizePathStyle: {stroke: '#ffffff'}});
                    } else if(target.hits == target.hitsMax) {
                        creep.memory.repairTargetId = null;
                    }
                } else if (target.structureType == STRUCTURE_STORAGE) {
                    var response = creep.transfer(target, RESOURCE_ENERGY);
                    if (response == ERR_NOT_IN_RANGE) {
                        // Want to use pathToStorage, but doesn't really work. Uses about 0.5 CPU
                        var first = Game.cpu.getUsed();
                        creep.moveTo(target, { reusePath: 30,  visualizePathStyle: {stroke: '#ffffff'}});
                        console.log(Game.cpu.getUsed() - first);
                    } else if (response == OK) {
	                    var flag = Game.flags[creep.memory.flagName];
                        var path = creep.pos.findPathTo(flag, { ignoreCreeps: true });
                        
                        if (!creep.memory.minPathLength || path.length < creep.memory.minPathLength) {
                            creep.memory.minPathLength = path.length;
                            creep.memory.pathToSource = Room.serializePath(path);
                        }
                    }
                }
            }
        }
	},
	spawn: function(spawnName, energyUsed, harvestFlagName) {
	    var roomMemory = Memory.rooms[Game.spawns[spawnName].room.name];
	    
        body = helpers.generateBody(energyUsed, [WORK,CARRY,MOVE]);
        
        var hasMaintainer = false; // only maintain if no other creep is maintaining
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'distanceHarvester' && creep.memory.flagName == harvestFlagName && creep.memory.doesMaintain) {
                hasMaintainer = true;
            }
        }
        
	    var memoryObject = { role: 'distanceHarvester', doesMaintain: !hasMaintainer, flagName: harvestFlagName, destTargetId: null, sourceTargetId: null, pathToSource: null, minPathLength: 2000 }; // then have the helper append baseRoom and role
	    
	    if (helpers.spawn(spawnName, energyUsed, body, memoryObject) == OK) {
	        if (!Game.flags[harvestFlagName].memory.harvesterCount) {
	            Game.flags[harvestFlagName].memory.harvesterCount = 0;
	        }
	        Game.flags[harvestFlagName].memory.harvesterCount ++;   
	    }
	},
	removeFlagCountIfDistanceHarvesterDies: function(deadHarvester) {
        Game.flags[deadHarvester.flagName].harvesterCount --;
	},
};

module.exports = roleDistanceHarvester;