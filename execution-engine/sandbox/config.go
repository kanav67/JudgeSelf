package sandbox

import "fmt"

type IsolateConfig struct {
	MemoryLimit    int64   //in kb
	TimeLimit      float64 //in seconds
	ExtraTimeLimit float64 //in seconds
	WallTimeLimit  float64 //in seconds
	Stack          int     //in kb, default 64MB
	FileSizeLimit  int64   //in kb, default 16MB
	DirMounts      []MountDir
}

type MountDir struct {
	Source      string
	Destination string
	WriteAccess bool
	NoExecute   bool
}

var hardLimits = IsolateConfig{
	MemoryLimit:    3 * 1024 * 1024, // 3 GB
	TimeLimit:      15.0,            // 15 seconds
	ExtraTimeLimit: 2.0,             // 1 second
	WallTimeLimit:  20.0,            // 20 seconds
	Stack:          64 * 1024,       // 64 MB
	FileSizeLimit:  16 * 1024,       // 16 MB
}

func NewIsolateConfig(opts ...func(*IsolateConfig)) *IsolateConfig {
	config := &IsolateConfig{
		MemoryLimit:    256 * 1024, // 256 MB
		TimeLimit:      5.0,        // 5 seconds
		WallTimeLimit:  10.0,       // 10 seconds
		ExtraTimeLimit: 1.0,        // 1 second
		Stack:          64 * 1024,  // 64 MB
		FileSizeLimit:  16 * 1024,  // 16 MB
	}

	for _, opt := range opts {
		opt(config)
	}

	return config
}

func HardLimits() IsolateConfig {
	return hardLimits
}

func (ic *IsolateConfig) applyHardLimits() {
	if ic.MemoryLimit > hardLimits.MemoryLimit {
		ic.MemoryLimit = hardLimits.MemoryLimit
	}
	if ic.TimeLimit > hardLimits.TimeLimit {
		ic.TimeLimit = hardLimits.TimeLimit
	}
	if ic.ExtraTimeLimit > hardLimits.ExtraTimeLimit {
		ic.ExtraTimeLimit = hardLimits.ExtraTimeLimit
	}
	if ic.WallTimeLimit > hardLimits.WallTimeLimit {
		ic.WallTimeLimit = hardLimits.WallTimeLimit
	}
	if ic.Stack > hardLimits.Stack {
		ic.Stack = hardLimits.Stack
	}
	if ic.FileSizeLimit > hardLimits.FileSizeLimit {
		ic.FileSizeLimit = hardLimits.FileSizeLimit
	}
}

func (ic *IsolateConfig) toArgs() []string {
	ic.applyHardLimits()

	args := []string{}

	args = append(args, "-m", fmt.Sprintf("%d", ic.MemoryLimit))
	args = append(args, "-t", fmt.Sprintf("%.2f", ic.TimeLimit))
	args = append(args, "-w", fmt.Sprintf("%.2f", ic.WallTimeLimit))
	args = append(args, "-E", fmt.Sprintf("%.2f", ic.ExtraTimeLimit))
	args = append(args, "-s", fmt.Sprintf("%d", ic.Stack))
	args = append(args, "-f", fmt.Sprintf("%d", ic.FileSizeLimit))

	return args
}
