var helpers = require('helpers');

var roleMiner = {
    run: function(creep, spawnName) {
        var sources = creep.room.find(FIND_SOURCES);
        var mainSpawn = Game.spawns[spawnName];
        
        var sourceWithoutContainer = this.findSourceWithoutContainer(creep, sources);
        
        if (sourceWithoutContainer) {
            var paths = this.getPathsToSource(creep, sourceWithoutContainer, mainSpawn);

            if(!paths) {
                console.log('Found no valid paths to the source.');
            } else {
                var optimalLocation = this.determineBestLocationForContainer(creep, paths);
                
                if(mainSpawn.room.createConstructionSite(optimalLocation.x, optimalLocation.y, STRUCTURE_CONTAINER) == OK) {
                    Memory.sources[sourceWithoutContainer.id].containerLocation = optimalLocation;
                }
            }
        }
        
        // If the miner doesn't have a source yet.
        if (creep.memory.targetSourceId == null) {
            var sourceWithoutMiner = this.findSourceWithoutMiner(creep, sources);
            
            // If the source without any properties (container, hasMiner, containerLocation).
            if (sourceWithoutMiner && (Memory.sources[sourceWithoutMiner.id] == null || Memory.sources[sourceWithoutMiner.id].containerLocation == null)) {
                var paths = this.getPathsToSource(creep, sourceWithoutMiner, mainSpawn);

                if (!paths) {
                    console.log('Found no valid paths to the source.');
                } else {
                    var optimalLocation = this.determineBestLocationForContainer(creep, paths);
                    
                    console.log('Making container at ' + JSON.stringify(optimalLocation));
                    mainSpawn.room.createConstructionSite(optimalLocation, STRUCTURE_CONTAINER);
                    
                    Memory.sources[sourceWithoutMiner.id].containerLocation = optimalLocation;
                }
            }
            
            if (sourceWithoutMiner && (Memory.sources[sourceWithoutMiner.id] != null && Memory.sources[sourceWithoutMiner.id].containerId == null)) {
                var location = Memory.sources[sourceWithoutMiner.id].containerLocation;
                if (location) {
                    var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && JSON.stringify(s.pos) == JSON.stringify(location)
                    });
                    
                    if(container) {
                        Memory.sources[sourceWithoutMiner.id].containerId = container.id;
                    }
                }
            }
            
            if (sourceWithoutMiner && sources.length == 2 && (Memory.sources[sourceWithoutMiner.id] == null || Memory.sources[sourceWithoutMiner.id].creepType == null)) {
                this.determineSourceCreepTypes(creep, sources);
            } else if(sourceWithoutMiner && sources.length == 1) {
                Memory.sources[sources[0].id].creepType = 'any';
            }
            
            Memory.rooms[creep.memory.baseRoom].sourceCount = sources.length;
            
            creep.memory.targetSourceId = sourceWithoutMiner.id;
        }
        
        if(creep.memory.targetSourceId) {
            var containerLocation = Memory.sources[creep.memory.targetSourceId].containerLocation;
            var targetSource = sources.find((s) => s.id == creep.memory.targetSourceId);
            
            var response = creep.harvest(targetSource);
            if(response == ERR_NOT_IN_RANGE || JSON.stringify(creep.pos) != JSON.stringify(containerLocation)) {
                creep.moveTo(containerLocation.x, containerLocation.y, {visualizePathStyle: {stroke: '#ffaa00'}});
            } else if(response == OK) {
                Memory.sources[targetSource.id].hasMiner = true;
            }
        }
	},
	findSourceWithoutContainer: function(creep, sources) {
        var sourceWithoutMiner;
        for(var i = 0;i<sources.length;i++) {
            if(Memory.sources[sources[i].id] != null && !Memory.sources[sources[i].id].containerLocation) {
                sourceWithoutMiner = sources[i];
                break;
            }
        }
        return sourceWithoutMiner;
	},
    findSourceWithoutMiner: function(creep, sources) {
        // if there is only one miner (2 because this one just spawnned), then just choose the other souce
        var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner');
        if(miners.length == 2 && sources.length == 2) {
            for(var i = 0;i<sources.length;i++) {
                if(miners[0].memory.targetSourceId != sources[i].id) {
                    return sources[i];
                }
            }
        }
        
        // If miners = 0, then we have to pick the best source, i.e. the harvest source
        var sourcesWithoutMiner = [];
        for(var i = 0;i<sources.length;i++) {
            if(Memory.sources[sources[i].id] == null) {
                sourcesWithoutMiner.push(sources[i]);
                Memory.sources[sources[i].id] = {
                    hasMiner: false,
                };
            }
            
            if(!Memory.sources[sources[i].id].hasMiner) { 
                sourcesWithoutMiner.push(sources[i]);
            }
        }
        
        // Collects the sources without a miner, then favors harvester ones
        for(var i = 0;i<sourcesWithoutMiner.length;i++) {
            if(Memory.sources[sourcesWithoutMiner[i].id].creepType == 'harvest') {
                return sourcesWithoutMiner[i];
            }
        }
        
        return sourcesWithoutMiner.length > 0 ? sourcesWithoutMiner[0] : null;
    },
    getPathsToSource: function(creep, sourceWithoutMiner, mainSpawn) {
        var x = sourceWithoutMiner.pos.x;
        var y = sourceWithoutMiner.pos.y;
        
        var paths = [];
        for(var i = -1;i <= 1;i++) {
            for(var j = -1;j <= 1;j++) {
                if(Game.map.getTerrainAt(x+i, y+j, creep.room.name) == 'plain') {
                    paths.push({ length: mainSpawn.pos.findPathTo(x+i, y+j, {ignoreCreeps: true}).length, x:(x+i), y:(y+j) }); 
                }
            }
        }
        
        return paths;
    },
    determineBestLocationForContainer: function(creep, paths) {
        // Finds the min paths after getting all of the paths
        var minLength = paths[0].length;
        var minX = paths[0].x;
        var minY = paths[0].y;

        for(var i = 0;i < paths.length;i++) {
            if(paths[i].length < minLength) {
                minLength = paths[i].length;
                minX = paths[i].x;
                minY = paths[i].y;
            }
        }
        
        return {x: minX, y: minY, roomName: creep.room.name};
    },
    determineSourceCreepTypes: function(creep, sources) {
        var extensions = creep.room.find(FIND_STRUCTURES, {
            filter: function(s) {
                return s.structureType == STRUCTURE_EXTENSION
            },
        });
        
        if(extensions) {
            var avgX = 0;
            var avgY = 0;
            for(var i = 0;i<extensions.length;i++) {
                avgX += extensions[i].pos.x;
                avgY += extensions[i].pos.y;
            }
            avgX = Math.floor(avgX / extensions.length);
            avgY = Math.floor(avgY / extensions.length);
            
            var proximity0 = sources[0].pos.findPathTo(avgX, avgY, {ignoreCreeps: true});
            var proximity1 = sources[1].pos.findPathTo(avgX, avgY, {ignoreCreeps: true});
            
            // if source 0 is closer to extension
            if(proximity0 < proximity1) {
                Memory.sources[sources[0].id].creepType = 'harvest';
                Memory.sources[sources[1].id].creepType = 'not-harvest';
            } else {
                Memory.sources[sources[0].id].creepType = 'not-harvest';
                Memory.sources[sources[1].id].creepType = 'harvest';
            }
        }
    },
    spawn: function(spawnName, energyAmount) {
        body = [WORK,WORK,WORK,WORK,WORK,MOVE];
	    
	    var memoryObject = { role: 'miner', sourceTargetId: null };
	    
	    helpers.spawn(spawnName, energyAmount, body, memoryObject);
    },
};

module.exports = roleMiner;