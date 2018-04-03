var helpers = require('helpers');

var roleBuilder = {
    run: function(creep) {
	    if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('?? harvest');
	    }
	    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.memory.sourceTargetId = null;
	        creep.say('?? build');
	    }

	    if (creep.memory.building) {
	        if (!creep.memory.buildTargetId) {
	            creep.memory.buildTargetId = this.findConstructionSiteId(creep);
	        }
	        
	        if (creep.memory.buildTargetId) {
	            var buildTarget = Game.getObjectById(creep.memory.buildTargetId);
	            
	            var response = creep.build(buildTarget);
                if(response == ERR_NOT_IN_RANGE) {
                    creep.moveTo(buildTarget, {visualizePathStyle: {stroke: '#ffffff'}});
                } else if (response != OK) {
                    creep.memory.buildTargetId = null;
                }
	        }
	    } else {
            if(!creep.memory.sourceTargetId) {
                var container = helpers.getClosestContainer(creep);
                if(container) {
                    creep.memory.sourceTargetId = container.id;
                }
            }
            
            if(creep.memory.sourceTargetId) {
                var container = Game.getObjectById(creep.memory.sourceTargetId);
                
                if(container) {
                    var response = creep.withdraw(container, RESOURCE_ENERGY);
                    
                    if(response == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                    } else if(response == ERR_NOT_ENOUGH_RESOURCES || container.store.energy <= 10) {
                        // Use storage if container is empty
                        if(creep.room.storage.store.energy > Memory.rooms[creep.room.name].storageMax) {
                            creep.memory.sourceTargetId = creep.room.storage.id;
                        }
                    }
                }
            }
	    }
	},
	findConstructionSiteId: function(creep) {
        var site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(site) {
            return site.id;
        }
        
        Memory.rooms[creep.memory.baseRoom].builderCount--;
        Memory.rooms[creep.memory.baseRoom].upgraderCount++;
        delete Memory.creeps[creep.name].building;
        delete Memory.creeps[creep.name].buildTargetId;
        creep.memory.role = 'upgrader';
        
        return null;
	},
	spawn: function(spawnName, energyAmount) {
	    body = helpers.generateBody(energyAmount, [WORK, CARRY, MOVE]);
	    
        var sites = Game.spawns[spawnName].room.find(FIND_CONSTRUCTION_SITES);
	    if (sites.length > 0) {
	        var memoryContents = { role: 'builder', building: false, sourceTargetId: null, buildTargetId: null };
	    } else {
	        var memoryContents = { role: 'upgrader', upgrading: false, sourceTargetId: null };
	    }
	    
	    helpers.spawn(spawnName, energyAmount, body, memoryContents);
	},
};

module.exports = roleBuilder;